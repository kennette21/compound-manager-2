# Supabase Setup Guide

## Quick Start

### Option 1: Run Combined Migration (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `combined_migration.sql` and paste it
4. Click **Run**

### Option 2: Run Individual Migrations

Run the files in the `migrations/` folder in order (00001 through 00020).

## Post-Migration Steps

### 1. Create Storage Bucket

Go to **Storage** in your Supabase dashboard:

1. Click **New bucket**
2. Name: `photos`
3. Check **Public bucket** (for easy photo access)
4. Click **Create bucket**

### 2. Set Up Storage Policies

In the Storage section, click on the `photos` bucket, then **Policies**:

**Policy 1: Allow uploads**
- Click **New policy** → **For full customization**
- Name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy: `true`

**Policy 2: Allow reads**
- Name: `Allow public reads`
- Allowed operation: `SELECT`
- Target roles: `public` (or `authenticated` for private)
- Policy: `true`

**Policy 3: Allow deletes**
- Name: `Allow authenticated deletes`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy: `true`

### 3. Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configure Email Auth (Optional)

By default, Supabase requires email confirmation. To disable for development:

1. Go to **Authentication** → **Providers**
2. Click on **Email**
3. Toggle off **Confirm email**

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `properties` | Land properties/compounds |
| `property_members` | User-property relationships |
| `categories` | Project categories per property |
| `projects` | Work projects with location data |
| `missions` | GPS tracking sessions |
| `mission_points` | Raw GPS points from missions |
| `photos` | Photo metadata with location |
| `comments` | Project comments |

### Key Functions

- `create_property_with_owner(name, description, lat, lng)` - Creates property and makes caller the owner
- `get_property_stats(property_id)` - Returns JSON with project/mission statistics
- `invite_user_to_property(property_id, email, role)` - Invites user by email

## Testing Your Setup

After running migrations, test with this SQL:

```sql
-- This should return the PostGIS version
SELECT PostGIS_Version();

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

## Troubleshooting

### "extension postgis does not exist"
PostGIS should be pre-installed. If not, go to **Database** → **Extensions** and enable PostGIS.

### RLS blocking queries
Make sure you're authenticated. RLS policies require `auth.uid()` to be set.

### Storage upload failing
Check that the `photos` bucket exists and has proper policies.
