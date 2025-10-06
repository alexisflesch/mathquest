# API Taxonomy - Question Metadata

## Overview

The taxonomy API provides access to question metadata (grade levels, disciplines, themes, and tags) stored in the database. This metadata is sourced from YAML files in the repository and imported into the `taxonomy` table.

## Endpoints

### GET `/api/v1/questions/taxonomy`

Returns all taxonomy data for all grade levels.

**Response format:**
```json
{
  "gradeLevels": ["CP", "CE1", "L1", "L2"],
  "metadata": {
    "CP": {
      "niveau": "CP",
      "disciplines": [
        {
          "nom": "Mathématiques",
          "themes": [
            {
              "nom": "Nombres",
              "tags": ["addition", "soustraction"]
            }
          ]
        }
      ]
    },
    "CE1": { ... }
  }
}
```

### GET `/api/v1/questions/taxonomy/:level`

Returns taxonomy metadata for a specific grade level (e.g., `CP`, `CE1`, `L1`, `L2`).

**Response format:**
```json
{
  "niveau": "CP",
  "disciplines": [
    {
      "nom": "Mathématiques",
      "themes": [
        {
          "nom": "Nombres",
          "tags": ["addition", "soustraction"]
        }
      ]
    }
  ]
}
```

**Error responses:**
- `404 Not Found` - Grade level does not exist
- `500 Internal Server Error` - Validation or database error

## Data Source

The taxonomy metadata is sourced from YAML files located in the repository root:

```
questions/
  CP.yaml
  CE1.yaml
  L1.yaml
  L2.yaml
```

These files contain the canonical metadata structure with disciplines, themes, and tags for each grade level.

## Import Script

To update the taxonomy database with changes from YAML files, run the manual import script:

```bash
cd /home/aflesch/mathquest
python3 scripts/import_taxonomy.py [--yes]
```

The script:
- Reads all root-level `questions/*.yaml` files
- Validates the taxonomy structure
- Computes a content hash (SHA-256) for change detection
- Upserts rows into the `taxonomy` table (Postgres)

**Environment variables** (in `scripts/.env`):
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host (default: `localhost`)
- `DB_PORT` - Database port (default: `5432`)

## Database Schema

**Table:** `taxonomy`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `gradeLevel` | String | Unique grade level identifier (e.g., `CP`) |
| `content` | JSON | Full metadata structure |
| `contentHash` | String | SHA-256 hash of canonical JSON (for change detection) |
| `updatedAt` | DateTime | Last update timestamp |

## Frontend Integration

The frontend metadata loader (`app/frontend/src/app/teacher/questions/edit/utils/metadata.ts`) fetches taxonomy data from the API on page load:

```typescript
export async function loadMetadata(): Promise<ParsedMetadata> {
    const response = await fetch(createApiUrl('/questions/taxonomy'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return await response.json();
}
```

The Monaco YAML editor receives the metadata as a prop and uses it for autocomplete suggestions (grade levels, disciplines, themes, tags).

## Shared Types

The taxonomy types are shared between backend and frontend via Zod schemas:

**Location:** `app/shared/types/taxonomy.ts`

**Key types:**
- `ParsedMetadata` - Full taxonomy structure with all grade levels
- `GradeLevelMetadata` - Metadata for a single grade level
- `MetadataDiscipline` - Discipline with themes
- `MetadataTheme` - Theme with tags

**Validation:** All API responses are validated using `ParsedMetadataSchema.safeParse()` to ensure data integrity.

## Implementation Notes

- The taxonomy API is **read-only** (no POST/PUT/DELETE endpoints)
- Updates to taxonomy must be done via the import script (offline workflow)
- The API validates all responses against Zod schemas before returning data
- Frontend caches metadata in component state; no client-side persistence
- Monaco editor completions update dynamically when metadata is fetched

**⚠️ Critical Routing Order**: The taxonomy router must be registered **before** the questions router in `app/backend/src/api/v1/index.ts`. Express matches routes in order, so the more specific `/questions/taxonomy` must come before the generic `/questions` route to prevent taxonomy requests from being treated as question lookups with UID "taxonomy".

## Related Files

**Backend:**
- `app/backend/src/api/v1/taxonomy.ts` - API router
- `app/backend/prisma/schema.prisma` - `Taxonomy` model definition
- `app/backend/tests/api/v1/taxonomy.test.ts` - API tests

**Frontend:**
- `app/frontend/src/app/teacher/questions/edit/utils/metadata.ts` - Metadata loader
- `app/frontend/src/app/teacher/questions/edit/components/MonacoYamlEditor.tsx` - Uses metadata for autocomplete

**Shared:**
- `app/shared/types/taxonomy.ts` - Zod schemas and TypeScript types

**Scripts:**
- `scripts/import_taxonomy.py` - Manual import script
- `scripts/.env` - Database connection configuration

## Migration History

- **2025-10-06:** Initial implementation of taxonomy API and import script
  - Added `Taxonomy` model to Prisma schema
  - Created manual import script for YAML files
  - Implemented read-only API endpoints
  - Updated frontend to fetch from API instead of static files
