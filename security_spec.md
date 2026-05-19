# Security Specification - CitizenReport

## Data Invariants
1. Incidents must have a valid title (size 3-100), description (size 10-2000), and a category from the allowed set.
2. Incidents must include a valid latitude, longitude, and address.
3. Every incident must have a `userId` that exactly matches the creator's `request.auth.uid`.
4. Users can only edit or delete their own incidents.
5. `userName` in the incident must match the user's current display name or profile name.
6. `users/{userId}` documents can only be created by the owner and must match the `request.auth.uid`.
7. `createdAt` must be immutable and set to `request.time`.
8. `updatedAt` must be set to `request.time` on updates.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Theft**: Creating an incident with someone else's `userId`.
2. **Ghost Change**: Updating an incident's `userId` after creation.
3. **Empty Report**: Creating an incident with empty title or description.
4. **Invalid Category**: Setting category to "Nuclear Blast".
5. **PII Leak**: Reading another user's private profile data (though we only have a public-ish one here).
6. **Resource Poisoning**: Long title (1MB string).
7. **Orphaned Write**: Creating an incident referencing a non-existent user (checked via auth).
8. **Time Travel**: Setting `createdAt` to a past date.
9. **Unauthorized Edit**: User B trying to edit User A's incident.
10. **Unauthorized Delete**: User B trying to delete User A's incident.
11. **Shadow Field**: Adding `isVerified: true` to an incident.
12. **Id Poisoning**: Using a 2KB string as a document ID.
