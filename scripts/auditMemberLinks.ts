// Operator-Skript (READ-ONLY): prüft je Firma die Verknüpfung Employee <->
// Membership, auf die assignRole/setMemberStatus angewiesen sind
// (docs/firebase/member-security-actions.md, Abschnitt Migration).
//
// Es SCHREIBT NICHTS und repariert nichts. Befunde sind manuell zu beheben
// (z. B. userMemberships/{uid}.employeeId im Firebase-Admin-Kontext setzen); es gibt
// bewusst kein automatisches Mapping über E-Mail oder Namen.
//
// Zugangsdaten wie der Server (nie committen, nie ausgeben):
//   FIREBASE_SERVICE_ACCOUNT_KEY oder GOOGLE_APPLICATION_CREDENTIALS,
//   FIREBASE_ADMIN_PROJECT_ID (oder NEXT_PUBLIC_FIREBASE_PROJECT_ID).
// Lokal gegen den Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 setzen.
//
// Ausführen:
//   npx tsx scripts/auditMemberLinks.ts                  (alle Firmen)
//   npx tsx scripts/auditMemberLinks.ts --company <id>   (eine Firma)
import { auditMemberLinks, type AuditEmployee, type AuditMembership } from "../src/lib/security/memberLinkAudit";
import { getAdminFirestore } from "../src/server/memberActions/firebaseAdmin";

function companyArgument(): string | undefined {
  const index = process.argv.indexOf("--company");
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const db = getAdminFirestore();
  const only = companyArgument();
  const companyIds = only ? [only] : (await db.collection("companies").listDocuments()).map((ref) => ref.id);

  let errors = 0;
  let warnings = 0;
  for (const companyId of companyIds) {
    const [employeeSnapshot, membershipSnapshot] = await Promise.all([
      db.collection(`companies/${companyId}/employees`).get(),
      db.collection("userMemberships").where("companyId", "==", companyId).get(),
    ]);
    const employees: AuditEmployee[] = employeeSnapshot.docs.map((doc) => ({
      id: doc.id,
      roleId: doc.data().roleId,
      status: doc.data().status,
    }));
    const memberships: AuditMembership[] = membershipSnapshot.docs.map((doc) => ({
      uid: doc.id,
      employeeId: doc.data().employeeId,
      roleId: doc.data().roleId,
      status: doc.data().status,
    }));

    const findings = auditMemberLinks({ employees, memberships });
    console.log(`\n[${companyId}] ${employees.length} Mitarbeiter, ${memberships.length} Memberships, ${findings.length} Befunde`);
    for (const finding of findings) {
      if (finding.severity === "error") errors += 1;
      if (finding.severity === "warning") warnings += 1;
      const who = [finding.uid && `uid=${finding.uid}`, finding.employeeId && `employee=${finding.employeeId}`].filter(Boolean).join(" ");
      console.log(`  ${finding.severity.toUpperCase().padEnd(7)} ${finding.code} ${who} – ${finding.detail}`);
    }
  }
  console.log(`\nFertig: ${errors} Fehler, ${warnings} Warnungen. Es wurde nichts geschrieben.`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("[auditMemberLinks] Fehlgeschlagen:", error instanceof Error ? error.message : error);
  process.exit(1);
});
