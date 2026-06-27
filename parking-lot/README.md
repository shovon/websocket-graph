# parking-lot

Material extracted from the overlay corpus that is **not discovered floor** — imported
conclusions (threat models, deployment best-practice) that read like derivations but were
never earned from first principles. Kept because it surfaced real concerns worth revisiting;
moved out of `specifications/` so it cannot anchor work that is supposed to start from the floor.

**Do not cite these as conformance or as settled necessity, and keep them out of the context
of any first-principles derivation of the overlay.** They are written in the same confident
"this is forced" voice as the earned memos, which is exactly why they are dangerous left in
place: they impersonate conclusions.

**Bar for moving anything back into `specifications/`:** each claim must be re-derived as a
specific grant of Path Emergence §2 (`../specifications/overlay/path-emergence.md`) *coming
due* — the unique-ID-as-mere-label grant, or the perfect-world grant. What hangs off a failing
grant is floor; what does not is engineering judgment and stays here.

## Contents

- `hardening-the-overlay.md` — the "non-negotiables" exercise: cryptographic identity,
  end-to-end authentication, the untrusted-carrier stance, a layered envelope. Some of it
  looks derivable (identity→key; untrusted-carrier); much of it is best-practice import.
- `server-stewardship.md` — deployment ops: a trusted server policing the carriers it relays
  for. Built on `hardening-the-overlay.md`, so doubly downstream of the floor; cannot stand
  until hardening is re-derived.
