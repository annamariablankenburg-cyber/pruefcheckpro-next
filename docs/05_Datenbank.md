# PrüfCheckPro – Datenbankmodell

Version: 1.0

---

# Datenbank

PrüfCheckPro verwendet Firebase Firestore als Cloud-Datenbank.

Die Datenbank ist dokumentenbasiert und besteht aus mehreren Collections.

---

# Collections

## users

Speichert alle Benutzer.

Felder:

- id
- firstName
- lastName
- email
- role
- companyId
- avatar
- language
- createdAt
- lastLogin

---

## companies

Unternehmen

Felder

- id
- name
- address
- phone
- email
- logo
- subscription
- createdAt

---

## laboratories

Labore

Felder

- id
- companyId
- name
- location

---

## learningCards

Lernkarten

Felder

- id
- title
- topic
- question
- answer
- difficulty
- tags
- createdBy
- createdAt

---

## quizzes

Quiz

Felder

- id
- title
- topic
- questions
- difficulty

---

## exams

Prüfungen

Felder

- id
- title
- category
- duration
- questions
- createdAt

---

## specimens

Probekörper

Felder

- id
- type
- material
- laboratory
- age
- dimensions
- status
- createdAt

---

## tests

Prüfungen im Labor

Felder

- id
- specimenId
- standard
- result
- unit
- tester
- createdAt

---

## reports

PDF-Berichte

Felder

- id
- title
- userId
- file
- createdAt

---

## notifications

Benachrichtigungen

Felder

- id
- userId
- title
- text
- read
- createdAt

---

## settings

Benutzereinstellungen

Felder

- userId
- language
- theme
- notifications
- emailNotifications

---

## subscriptions

Abonnements

Felder

- companyId
- plan
- stripeCustomerId
- stripeSubscriptionId
- status
- renewalDate

---

# Beziehungen

users

↓

company

↓

laboratory

↓

specimen

↓

test

↓

report

---

# Rollen

- Azubi
- Mitarbeiter
- Ausbilder
- Laborleiter
- Administrator

---

# Ziel

Eine skalierbare Datenbankstruktur, die später problemlos erweitert werden kann.