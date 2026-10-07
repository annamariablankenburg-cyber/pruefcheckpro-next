// UI-Zugriffs-Policy der acht Fachbereiche (rein, ohne React/Firebase): Mapping auf die Rules-Phase-2-
// Schlüssel, Unabhängigkeit von view/create/edit/delete, Berichte-Export, Dialog-Abhängigkeiten
// (Pflicht- vs. optionale Referenzen), Service-Abhängigkeiten (Lesen vor/nach dem Schreiben),
// fail-closed und Navigation. UI-Gating ist Komfort – die Firestore Rules sind die Sicherheitsgrenze.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import { allPermissionKeys, buildPermissions, roles as configRoles } from "../../src/config/roles";
import { navGroups } from "../../src/config/navigation";
import {
  DOMAIN_PERMISSION_KEYS,
  REPORT_EXPORT_PERMISSION_KEY,
  filterNavGroups,
  filterNavItems,
  getCalendarFormAccess,
  getCalendarUiAccess,
  getDomainAccess,
  getDomainActions,
  getLaborbookFormAccess,
  getLaborbookUiAccess,
  getProjectFormAccess,
  getProjectUiAccess,
  getReportAccess,
  getReportActions,
  getReportFormAccess,
  getReportUiAccess,
  getSampleFormAccess,
  getSampleUiAccess,
  getTestEntryFormAccess,
  getTestEntryReportAction,
  getTestEntryUiAccess,
  isNavItemVisible,
  type DomainKey,
} from "../../src/lib/permissions/domainAccess";

const DOMAINS = Object.keys(DOMAIN_PERMISSION_KEYS) as DomainKey[];
const OPERATIONS = ["view", "create", "edit", "delete"] as const;

const grant = (...keys: string[]) => buildPermissions(keys);
const keys = (domain: DomainKey) => DOMAIN_PERMISSION_KEYS[domain];

describe("Mapping = Rules Phase 2", () => {
  it("jeder Schlüssel existiert in allPermissionKeys (keine Tippfehler, keine erfundenen Namen)", () => {
    for (const domain of DOMAINS) {
      for (const operation of OPERATIONS) {
        assert.ok(allPermissionKeys.includes(keys(domain)[operation]), `${domain}.${operation}: ${keys(domain)[operation]}`);
      }
    }
    assert.ok(allPermissionKeys.includes(REPORT_EXPORT_PERMISSION_KEY));
  });

  it("die Schlüssel entsprechen exakt den Regeln in firestore.rules (get/list, create, update, delete)", () => {
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8").replace(/\r\n/g, "\n").replace(/\/\/[^\n]*/g, "");
    const rule = {
      view: /allow get, list: if hasPermission\(companyId, "([^"]+)"\)/,
      create: /allow create: if hasPermission\(companyId, "([^"]+)"\)/,
      edit: /allow update: if hasPermission\(companyId, "([^"]+)"\)/,
      delete: /allow delete: if hasPermission\(companyId, "([^"]+)"\)/,
    } as const;
    for (const domain of DOMAINS) {
      const block = rules.match(
        new RegExp(`    match /companies/\\{companyId\\}/${domain}/\\{[A-Za-z]+\\} \\{\\n([\\s\\S]*?)\\n    \\}\\n`)
      );
      assert.ok(block, `Rules-Block ${domain} nicht gefunden`);
      for (const operation of OPERATIONS) {
        const found: RegExpMatchArray | null = block[1].match(rule[operation]);
        assert.ok(found, `${domain}.${operation} nicht im erwarteten Format`);
        assert.equal(found[1], keys(domain)[operation], `${domain}.${operation}`);
      }
    }
    // Export: die Rules verlangen pdf.exportieren zusätzlich beim Wechsel in einen Export-Status.
    assert.ok(rules.includes(`hasPermission(companyId, "${REPORT_EXPORT_PERMISSION_KEY}")`));
  });

  it("Kalender: Anlegen heißt kalender.termine_erstellen (Legacy), es gibt kein kalender.erstellen", () => {
    assert.equal(keys("calendarEvents").create, "kalender.termine_erstellen");
    assert.ok(!allPermissionKeys.includes("kalender.erstellen"));
  });
});

describe("Roh-Rechte (getDomainAccess): view/create/edit/delete sind voneinander unabhängig", () => {
  for (const domain of DOMAINS) {
    it(`${domain}: genau ein Recht → genau dieses Flag`, () => {
      for (const operation of OPERATIONS) {
        const access = getDomainAccess(domain, grant(keys(domain)[operation]));
        for (const other of OPERATIONS) {
          assert.equal(access[other], other === operation, `${domain}: nur ${operation} → ${other}`);
        }
      }
    });

    it(`${domain}: create ohne edit/delete, edit ohne create/delete, delete ohne edit`, () => {
      const k = keys(domain);
      assert.deepEqual(getDomainAccess(domain, grant(k.create)), { view: false, create: true, edit: false, delete: false });
      assert.deepEqual(getDomainAccess(domain, grant(k.edit)), { view: false, create: false, edit: true, delete: false });
      assert.deepEqual(getDomainAccess(domain, grant(k.delete)), { view: false, create: false, edit: false, delete: true });
      assert.deepEqual(getDomainAccess(domain, grant(k.view, k.edit)), { view: true, create: false, edit: true, delete: false });
    });

    it(`${domain}: Rechte anderer Bereiche zählen nicht`, () => {
      const others = DOMAINS.filter((candidate) => candidate !== domain).flatMap((candidate) =>
        OPERATIONS.map((operation) => keys(candidate)[operation])
      );
      assert.deepEqual(getDomainAccess(domain, grant(...others)), { view: false, create: false, edit: false, delete: false });
    });
  }
});

describe("Angebotene Aktionen (getDomainActions): alle Aktionen setzen *.ansehen voraus", () => {
  for (const domain of DOMAINS) {
    it(`${domain}: ohne ansehen keine Aktion, auch mit create/edit/delete`, () => {
      const k = keys(domain);
      assert.deepEqual(getDomainActions(domain, grant(k.create, k.edit, k.delete)), {
        view: false,
        create: false,
        edit: false,
        delete: false,
      });
    });

    it(`${domain}: mit ansehen folgen create/edit/delete den Roh-Rechten (unabhängig)`, () => {
      const k = keys(domain);
      assert.deepEqual(getDomainActions(domain, grant(k.view)), { view: true, create: false, edit: false, delete: false });
      assert.deepEqual(getDomainActions(domain, grant(k.view, k.create)), { view: true, create: true, edit: false, delete: false });
      assert.deepEqual(getDomainActions(domain, grant(k.view, k.edit)), { view: true, create: false, edit: true, delete: false });
      assert.deepEqual(getDomainActions(domain, grant(k.view, k.delete)), { view: true, create: false, edit: false, delete: true });
      assert.deepEqual(getDomainActions(domain, grant(k.view, k.create, k.edit, k.delete)), {
        view: true,
        create: true,
        edit: true,
        delete: true,
      });
    });
  }
});

describe("Berichte und Export", () => {
  const k = keys("reports");

  it("roh: export ist unabhängig von bearbeiten (und umgekehrt)", () => {
    assert.equal(getReportAccess(grant(k.edit)).export, false);
    assert.equal(getReportAccess(grant(REPORT_EXPORT_PERMISSION_KEY)).edit, false);
    assert.equal(getReportAccess(grant(REPORT_EXPORT_PERMISSION_KEY)).export, true);
    assert.equal(getReportAccess(grant(k.edit)).edit, true);
  });

  it("bearbeiten ohne pdf.exportieren: normal bearbeiten ja, Export nein", () => {
    const actions = getReportActions(grant(k.view, k.edit));
    assert.equal(actions.edit, true);
    assert.equal(actions.export, false);
  });

  it("pdf.exportieren ohne bearbeiten: kein Export (Export = Update des Berichts)", () => {
    const actions = getReportActions(grant(k.view, REPORT_EXPORT_PERMISSION_KEY));
    assert.equal(actions.export, false);
    assert.equal(actions.edit, false);
  });

  it("Export braucht bearbeiten + pdf.exportieren + ansehen (Zurücklesen)", () => {
    assert.equal(getReportActions(grant(k.view, k.edit, REPORT_EXPORT_PERMISSION_KEY)).export, true);
    assert.equal(getReportActions(grant(k.edit, REPORT_EXPORT_PERMISSION_KEY)).export, false); // ohne ansehen
  });

  it("direkt als exportierter Bericht anlegen braucht erstellen + pdf.exportieren", () => {
    assert.equal(getReportActions(grant(k.view, k.create)).createExported, false);
    assert.equal(getReportActions(grant(k.view, REPORT_EXPORT_PERMISSION_KEY)).createExported, false);
    assert.equal(getReportActions(grant(k.view, k.create, REPORT_EXPORT_PERMISSION_KEY)).createExported, true);
  });

  it("normales Anlegen braucht nur erstellen (+ ansehen) und die Pflicht-Referenz Probe lesen – kein pdf.exportieren", () => {
    const form = getReportFormAccess(grant(k.view, k.create, keys("samples").view));
    assert.equal(form.create, true);
    assert.equal(form.createExported, false);
    assert.deepEqual(getReportFormAccess(grant(k.view, k.create)).missing, ["Proben"]);
    assert.equal(getReportFormAccess(grant(k.view, k.create)).create, false);
    assert.equal(getReportFormAccess(grant(k.view, k.create, REPORT_EXPORT_PERMISSION_KEY, keys("samples").view)).createExported, true);
  });

  it("UI-Policy: Duplizieren = Anlegen (Entwurf), Bearbeiten/Export/Löschen getrennt", () => {
    const access = getReportUiAccess(grant(k.view, k.create, k.edit, k.delete, REPORT_EXPORT_PERMISSION_KEY, keys("projects").view));
    assert.equal(access.duplicate, true);
    assert.equal(access.export, true);
    assert.equal(access.delete, true);
    assert.equal(access.openProject, true);
    assert.equal(access.openCustomer, false);
    assert.equal(access.openSample, false);
    const readOnly = getReportUiAccess(grant(k.view));
    assert.deepEqual(
      [readOnly.create, readOnly.duplicate, readOnly.edit, readOnly.export, readOnly.delete],
      [false, false, false, false, false]
    );
  });
});

describe("Dialoge: Pflicht-Referenzen vs. optionale Referenzen", () => {
  it("Projekt: Pflicht-Referenz Kunde → Anlegen UND Bearbeiten brauchen kunden.ansehen", () => {
    const base = [keys("projects").view, keys("projects").create, keys("projects").edit];
    const without = getProjectFormAccess(grant(...base));
    assert.deepEqual([without.create, without.edit, without.missing], [false, false, ["Kunden"]]);
    const withCustomers = getProjectFormAccess(grant(...base, keys("customers").view));
    assert.deepEqual([withCustomers.create, withCustomers.edit, withCustomers.missing], [true, true, []]);
    // Anlegen ohne Bearbeiten-Recht
    assert.deepEqual(
      [
        getProjectFormAccess(grant(keys("projects").view, keys("projects").create, keys("customers").view)).create,
        getProjectFormAccess(grant(keys("projects").view, keys("projects").create, keys("customers").view)).edit,
      ],
      [true, false]
    );
  });

  it("Probe: Pflicht-Referenzen Projekt und Kunde (Kunde wird aus dem Projekt abgeleitet)", () => {
    const base = [keys("samples").view, keys("samples").create, keys("samples").edit];
    assert.deepEqual(getSampleFormAccess(grant(...base)).missing, ["Projekte", "Kunden"]);
    assert.equal(getSampleFormAccess(grant(...base, keys("projects").view)).create, false);
    assert.equal(getSampleFormAccess(grant(...base, keys("customers").view)).create, false);
    const full = getSampleFormAccess(grant(...base, keys("projects").view, keys("customers").view));
    assert.deepEqual([full.create, full.edit, full.missing], [true, true, []]);
  });

  it("Prüfung anlegen: Pflicht-Referenz Probe + createTestEntry liest vorab (pruefungen.ansehen)", () => {
    const k = keys("testValues");
    assert.equal(getTestEntryFormAccess(grant(k.view, k.create)).create, false); // Probe nicht lesbar
    assert.equal(getTestEntryFormAccess(grant(k.view, k.create, keys("samples").view)).create, true);
    assert.equal(getTestEntryFormAccess(grant(k.create, keys("samples").view)).create, false); // Vorab-Lesen fehlt
  });

  it("Kalender: Probe ist OPTIONAL – Anlegen/Bearbeiten ohne proben.ansehen weiter möglich, nur die Probenauswahl entfällt", () => {
    const k = keys("calendarEvents");
    const form = getCalendarFormAccess(grant(k.view, k.create, k.edit));
    assert.deepEqual([form.create, form.edit, form.sampleSelect, form.missing], [true, true, false, []]);
    assert.equal(getCalendarFormAccess(grant(k.view, k.create, keys("samples").view)).sampleSelect, true);
    assert.equal(getCalendarFormAccess(grant(keys("samples").view, k.create)).create, false); // ohne kalender.ansehen
  });

  it("Laborbuch: Proben, Projekte, Kunden und Geräte sind OPTIONAL und einzeln gesteuert", () => {
    const k = keys("laborbook");
    const none = getLaborbookFormAccess(grant(k.view, k.create));
    assert.equal(none.create, true);
    assert.deepEqual(none.refs, { samples: false, projects: false, customers: false, devices: false });
    const some = getLaborbookFormAccess(grant(k.view, k.create, keys("projects").view, keys("devices").view));
    assert.deepEqual(some.refs, { samples: false, projects: true, customers: false, devices: true });
    assert.equal(some.create, true);
  });
});

describe("Service-Abhängigkeiten (Lesen vor/nach dem Schreiben)", () => {
  it("Laborbuch bearbeiten/archivieren nur nutzbar mit bearbeiten UND ansehen (Transaktion mit transaction.get)", () => {
    const k = keys("laborbook");
    assert.equal(getLaborbookUiAccess(grant(k.edit)).edit, false);
    assert.equal(getLaborbookUiAccess(grant(k.view)).edit, false);
    assert.equal(getLaborbookUiAccess(grant(k.view, k.edit)).edit, true);
    // Roh-Recht bleibt unabhängig (Rules verlangen das Lesen nicht)
    assert.equal(getDomainAccess("laborbook", grant(k.edit)).edit, true);
  });

  it("alle Update-Flows (Zurücklesen nach dem Schreiben): edit nur mit ansehen angeboten", () => {
    for (const domain of DOMAINS) {
      assert.equal(getDomainActions(domain, grant(keys(domain).edit)).edit, false, domain);
      assert.equal(getDomainActions(domain, grant(keys(domain).view, keys(domain).edit)).edit, true, domain);
    }
  });

  it("createSample/createTestEntry lesen vorab: Anlegen nur mit ansehen angeboten", () => {
    assert.equal(getDomainActions("samples", grant(keys("samples").create)).create, false);
    assert.equal(getDomainActions("testValues", grant(keys("testValues").create)).create, false);
    assert.equal(getDomainActions("samples", grant(keys("samples").view, keys("samples").create)).create, true);
  });

  it("Löschen braucht kein Lesen, wird aber nur mit Seitenzugriff angeboten", () => {
    assert.equal(getDomainAccess("devices", grant(keys("devices").delete)).delete, true);
    assert.equal(getDomainActions("devices", grant(keys("devices").delete)).delete, false);
    assert.equal(getDomainActions("devices", grant(keys("devices").view, keys("devices").delete)).delete, true);
  });
});

describe("Seiten-Policies je Bereich", () => {
  it("Projekte: Statusaktionen = bearbeiten; Dialog zusätzlich kunden.ansehen; Verknüpfungen nach Leserecht", () => {
    const k = keys("projects");
    const access = getProjectUiAccess(grant(k.view, k.edit, keys("samples").view));
    assert.equal(access.edit, true);
    assert.equal(access.editDialog, false); // Kunden nicht lesbar
    assert.equal(access.create, false);
    assert.equal(access.viewSamples, true);
    assert.equal(access.newSample, false);
    assert.equal(access.openCustomer, false);
    assert.equal(getProjectUiAccess(grant(k.view, k.edit, keys("customers").view)).editDialog, true);
  });

  it("Proben: Duplizieren = erstellen, Status/Bulk = bearbeiten, Löschen/Bulk-Löschen = loeschen, Auswahl nur mit Bulk-Recht", () => {
    const k = keys("samples");
    const readOnly = getSampleUiAccess(grant(k.view));
    assert.deepEqual([readOnly.edit, readOnly.duplicate, readOnly.delete, readOnly.selectable], [false, false, false, false]);
    const editor = getSampleUiAccess(grant(k.view, k.edit));
    assert.deepEqual([editor.edit, editor.bulkEdit, editor.bulkDelete, editor.duplicate, editor.selectable], [true, true, false, false, true]);
    const creator = getSampleUiAccess(grant(k.view, k.create));
    assert.deepEqual([creator.duplicate, creator.edit, creator.selectable], [true, false, false]);
    const deleter = getSampleUiAccess(grant(k.view, k.delete));
    assert.deepEqual([deleter.delete, deleter.bulkDelete, deleter.bulkEdit, deleter.selectable], [true, true, false, true]);
    assert.equal(getSampleUiAccess(grant(k.view, keys("testValues").view)).enterValues, true);
    assert.equal(getSampleUiAccess(grant(k.view)).enterValues, false);
  });

  it("Prüfungen: Excel-Export nur mit bearbeiten + pdf.exportieren, Berichtsliste nur mit berichte.ansehen", () => {
    const k = keys("testValues");
    assert.equal(getTestEntryUiAccess(grant(k.view)).readReports, false);
    assert.equal(getTestEntryUiAccess(grant(k.view, keys("reports").view)).readReports, true);
    assert.equal(getTestEntryUiAccess(grant(k.view, keys("reports").view, keys("reports").edit, REPORT_EXPORT_PERMISSION_KEY)).export, true);
    assert.equal(getTestEntryUiAccess(grant(k.view, REPORT_EXPORT_PERMISSION_KEY)).export, false);
    assert.equal(getTestEntryUiAccess(grant(k.view, k.edit, k.delete)).edit, true);
    assert.equal(getTestEntryUiAccess(grant(k.view, k.edit, k.delete)).delete, true);
    assert.equal(getTestEntryUiAccess(grant(k.view, k.edit)).delete, false);
  });

  // Bericht öffnen und Bericht erstellen sind getrennte Rechte. Der Produktflow (handleCreateReport)
  // prüft anhand der Berichtsliste, ob zur Probe schon ein Bericht existiert; die Liste gibt es nur mit
  // berichte.ansehen. Ohne dieses Recht ist die Existenz nicht feststellbar -> fail-closed.
  describe("Prüfungen: Bericht öffnen vs. erstellen", () => {
    const t = keys("testValues");
    const r = keys("reports");
    const samples = keys("samples");

    it("berichte.ansehen, kein erstellen → öffnen ja, erstellen nein", () => {
      const access = getTestEntryUiAccess(grant(t.view, r.view));
      assert.deepEqual([access.viewReport, access.createReport], [true, false]);
      assert.equal(getTestEntryReportAction(access, true), "open");
      assert.equal(getTestEntryReportAction(access, false), null);
    });

    it("erstellen + Pflichtreferenz Probe, aber KEIN berichte.ansehen → fail-closed (Existenz nicht prüfbar)", () => {
      const access = getTestEntryUiAccess(grant(t.view, r.create, samples.view));
      assert.deepEqual([access.viewReport, access.createReport], [false, false]);
      assert.equal(access.readReports, false); // keine Berichtsliste -> keine Abfrage
      assert.equal(getTestEntryReportAction(access, false), null);
      assert.equal(getTestEntryReportAction(access, true), null);
    });

    it("ansehen + erstellen + Probe lesen → beide Möglichkeiten (je nach vorhandenem Bericht)", () => {
      const access = getTestEntryUiAccess(grant(t.view, r.view, r.create, samples.view));
      assert.deepEqual([access.viewReport, access.createReport], [true, true]);
      assert.equal(getTestEntryReportAction(access, true), "open");
      assert.equal(getTestEntryReportAction(access, false), "create");
    });

    it("ansehen + erstellen, aber Pflichtreferenz Probe nicht lesbar → nur öffnen, nicht erstellen", () => {
      const access = getTestEntryUiAccess(grant(t.view, r.view, r.create));
      assert.deepEqual([access.viewReport, access.createReport], [true, false]);
      assert.equal(getTestEntryReportAction(access, true), "open");
      assert.equal(getTestEntryReportAction(access, false), null);
    });

    it("weder ansehen noch erstellen → beide false, keine Aktion", () => {
      const access = getTestEntryUiAccess(grant(t.view));
      assert.deepEqual([access.viewReport, access.createReport], [false, false]);
      assert.equal(getTestEntryReportAction(access, true), null);
      assert.equal(getTestEntryReportAction(access, false), null);
    });

    it("pdf.exportieren bleibt getrennt: gibt weder öffnen noch erstellen, und umgekehrt kein Export", () => {
      const onlyExport = getTestEntryUiAccess(grant(t.view, REPORT_EXPORT_PERMISSION_KEY));
      assert.deepEqual([onlyExport.viewReport, onlyExport.createReport, onlyExport.export], [false, false, false]);
      const viewAndCreate = getTestEntryUiAccess(grant(t.view, r.view, r.create, samples.view));
      assert.equal(viewAndCreate.export, false);
      const full = getTestEntryUiAccess(grant(t.view, r.view, r.edit, REPORT_EXPORT_PERMISSION_KEY));
      assert.deepEqual([full.viewReport, full.createReport, full.export], [true, false, true]);
    });

    it("fail-closed: leere Rechte → keine Bericht-Aktion", () => {
      const access = getTestEntryUiAccess({});
      assert.deepEqual([access.viewReport, access.createReport], [false, false]);
      assert.equal(getTestEntryReportAction(access, true), null);
      assert.equal(getTestEntryReportAction(access, false), null);
    });
  });

  it("Kalender: Verschieben = bearbeiten, Duplizieren = anlegen, Löschen = loeschen; Verknüpfungen nach Leserecht", () => {
    const k = keys("calendarEvents");
    const access = getCalendarUiAccess(grant(k.view, k.create, k.delete, keys("testValues").view));
    assert.deepEqual([access.create, access.duplicate, access.delete, access.move, access.edit], [true, true, true, false, false]);
    assert.deepEqual([access.openSample, access.sampleSelect, access.enterValues], [false, false, true]);
    assert.equal(getCalendarUiAccess(grant(k.view, k.edit)).move, true);
  });

  it("Laborbuch: Anlegen, Bearbeiten (mit Lesen), Löschen unabhängig", () => {
    const k = keys("laborbook");
    const access = getLaborbookUiAccess(grant(k.view, k.create, k.delete));
    assert.deepEqual([access.create, access.edit, access.delete], [true, false, true]);
  });
});

describe("fail-closed", () => {
  const empty: Array<[string, Record<string, unknown> | null | undefined]> = [
    ["leere Map", {}],
    ["null", null],
    ["undefined", undefined],
    ["Schlüssel mit false", Object.fromEntries(allPermissionKeys.map((key) => [key, false]))],
    ["Werte, die nicht exakt true sind", Object.fromEntries(allPermissionKeys.map((key) => [key, "true"]))],
    ["Zahl 1", Object.fromEntries(allPermissionKeys.map((key) => [key, 1]))],
  ];

  for (const [label, map] of empty) {
    it(`${label} → alles false`, () => {
      const permissions = map as Record<string, boolean> | null | undefined;
      for (const domain of DOMAINS) {
        assert.deepEqual(getDomainAccess(domain, permissions), { view: false, create: false, edit: false, delete: false }, domain);
        assert.deepEqual(getDomainActions(domain, permissions), { view: false, create: false, edit: false, delete: false }, domain);
      }
      assert.equal(getReportAccess(permissions).export, false);
      const report = getReportActions(permissions);
      assert.deepEqual([report.export, report.createExported], [false, false]);
      for (const form of [
        getProjectFormAccess(permissions),
        getSampleFormAccess(permissions),
        getTestEntryFormAccess(permissions),
        getReportFormAccess(permissions),
        getCalendarFormAccess(permissions),
        getLaborbookFormAccess(permissions),
      ]) {
        assert.equal(form.create || form.edit, false);
      }
      assert.deepEqual(
        Object.values(getLaborbookFormAccess(permissions).refs).concat(getCalendarFormAccess(permissions).sampleSelect),
        [false, false, false, false, false]
      );
      assert.equal(Object.values(getSampleUiAccess(permissions)).some(Boolean), false);
      assert.equal(Object.values(getProjectUiAccess(permissions)).some(Boolean), false);
    });
  }

  it("unbekannte Schlüssel gewähren nichts", () => {
    assert.equal(getDomainAccess("customers", { "kunden.superuser": true, "kunden.alles": true } as Record<string, boolean>).view, false);
  });
});

describe("Systemrollen aus der Config (Erwartung aus permissions, nicht aus dem Namen)", () => {
  for (const role of configRoles) {
    it(`${role.name}: Roh-Rechte aller Bereiche = permissions[Schlüssel]`, () => {
      for (const domain of DOMAINS) {
        const access = getDomainAccess(domain, role.permissions);
        for (const operation of OPERATIONS) {
          assert.equal(access[operation], role.permissions[keys(domain)[operation]] === true, `${role.id} ${domain}.${operation}`);
        }
      }
    });
  }

  it("Matrix-Spotchecks: Laborleiter löscht keine Geräte/Laborbuch/Berichte, Azubi nirgends, Gast liest nur, Prüfer legt keine Kunden/Projekte/Geräte an", () => {
    const by = (id: string) => configRoles.find((role) => role.id === id)!.permissions;
    assert.equal(getDomainActions("devices", by("laborleiter")).delete, false);
    assert.equal(getDomainActions("laborbook", by("laborleiter")).delete, false);
    assert.equal(getDomainActions("reports", by("laborleiter")).delete, false);
    assert.equal(getDomainActions("samples", by("laborleiter")).delete, true);
    for (const domain of DOMAINS) {
      assert.equal(getDomainActions(domain, by("azubi")).delete, false, `azubi ${domain}`);
      const gast = getDomainActions(domain, by("gast"));
      assert.deepEqual([gast.view, gast.create, gast.edit, gast.delete], [true, false, false, false], `gast ${domain}`);
      assert.equal(getDomainActions(domain, by("admin")).delete, true, `admin ${domain}`);
    }
    for (const domain of ["customers", "projects", "devices"] as const) {
      const pruefer = getDomainActions(domain, by("pruefer"));
      assert.deepEqual([pruefer.create, pruefer.edit, pruefer.delete], [false, false, false], `pruefer ${domain}`);
    }
    assert.equal(getReportActions(by("pruefer")).export, true);
    assert.equal(getReportActions(by("azubi")).export, false);
    assert.equal(getReportActions(by("gast")).export, false);
  });
});

describe("Navigation", () => {
  it("die acht Fachbereiche sind mit ihrem View-Schlüssel markiert", () => {
    const required = new Map(navGroups.flatMap((group) => group.items).map((item) => [item.href, item.requiredPermission]));
    assert.equal(required.get("/kunden"), keys("customers").view);
    assert.equal(required.get("/projekte"), keys("projects").view);
    assert.equal(required.get("/geraete"), keys("devices").view);
    assert.equal(required.get("/probekoerper"), keys("samples").view);
    assert.equal(required.get("/pruefungen"), keys("testValues").view);
    assert.equal(required.get("/pdf-export"), keys("reports").view);
    assert.equal(required.get("/kalender"), keys("calendarEvents").view);
    assert.equal(required.get("/laborbuch"), keys("laborbook").view);
    // nicht Teil dieses Slices: bleiben ungated
    assert.equal(required.get("/dashboard"), undefined);
    assert.equal(required.get("/company"), undefined);
  });

  it("ohne Recht entfallen die Punkte, mit Recht erscheinen sie; leere Gruppen verschwinden", () => {
    const items = navGroups.flatMap((group) => group.items);
    assert.equal(isNavItemVisible(undefined, {}), true);
    assert.equal(isNavItemVisible("kunden.ansehen", {}), false);
    assert.equal(isNavItemVisible("kunden.ansehen", grant("kunden.ansehen")), true);
    const visible = filterNavItems(items, grant("kunden.ansehen")).map((item) => item.href);
    assert.ok(visible.includes("/kunden"));
    assert.ok(!visible.includes("/projekte"));
    assert.ok(visible.includes("/dashboard"));
    const groups = filterNavGroups(
      [{ label: "Nur gated", items: [{ requiredPermission: "kunden.ansehen" }] }, { label: "Frei", items: [{}] }],
      {}
    );
    assert.deepEqual(groups.map((group) => group.label), ["Frei"]);
  });

  it("während Rechte laden/fehlen (leere Map): kein gesperrter Bereich in der Navigation", () => {
    const gatedHrefs = navGroups.flatMap((group) => group.items).filter((item) => item.requiredPermission);
    assert.equal(gatedHrefs.length, 8);
    const visible = filterNavItems(gatedHrefs, {});
    assert.equal(visible.length, 0);
  });
});
