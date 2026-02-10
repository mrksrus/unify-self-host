# Contacts - Technical Documentation

## Overview

UniHub implements contact management with vCard (vcf) import/export support, allowing users to manage contacts and sync with external services.

## Architecture

### Components

- **Database**: MySQL `contacts` table
- **vCard Parser**: Custom parser for vCard 3.0 format
- **Export**: vCard generator for contact export
- **Frontend**: React components for contact management

## Database Schema

### `contacts` Table

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- first_name: VARCHAR(255)
- last_name: VARCHAR(255) NULL
- email: VARCHAR(255) NULL
- phone: VARCHAR(50) NULL
- company: VARCHAR(255) NULL
- job_title: VARCHAR(255) NULL
- notes: TEXT NULL
- is_favorite: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Indexes**:
- `idx_contacts_user`: For user-specific queries
- `idx_contacts_email`: For email lookups
- `idx_contacts_favorite`: For favorite filtering

## vCard Format

### Standard vCard 3.0

vCard is a standard format (RFC 2425, RFC 2426) used by:
- Google Contacts
- Apple Contacts
- Microsoft Outlook
- Most contact management systems

### Structure

```
BEGIN:VCARD
VERSION:3.0
N:Lastname;Firstname;;;
FN:Full Name
EMAIL;TYPE=INTERNET:email@example.com
TEL;TYPE=CELL:+1234567890
ORG:Company Name
TITLE:Job Title
NOTE:Notes
END:VCARD
```

## Import Process

### 1. File Upload
- User uploads `.vcf` file via web interface
- File parsed on server side
- Maximum file size: 500KB (configurable)

### 2. Parsing

**Steps**:
1. Read vCard file content
2. Split into individual vCard blocks
3. For each vCard:
   - Parse properties (N, FN, EMAIL, TEL, etc.)
   - Handle encoding (quoted-printable, UTF-8)
   - Extract contact data
   - Validate required fields (at least name required)
4. Insert contacts into database

### 3. Encoding Handling

**Quoted-Printable**:
- Some exports use quoted-printable encoding
- Decoded automatically: `=3D` → `=`, `=0A` → newline
- Handles Apple Contacts exports

**Character Escaping**:
- vCard uses `\;` for semicolons, `\,` for commas
- `\\` for backslashes
- Unescaped during parsing

### 4. Property Mapping

| vCard Property | Database Field | Notes |
|----------------|----------------|-------|
| `N` (Name) | `first_name`, `last_name` | Format: `Lastname;Firstname` |
| `FN` (Full Name) | `first_name`, `last_name` | Fallback if N not present |
| `EMAIL` | `email` | First email used |
| `TEL` | `phone` | First phone used |
| `ORG` | `company` | First organization |
| `TITLE` | `job_title` | Job title |
| `NOTE` | `notes` | Notes/description |

### 5. Duplicate Handling

- No automatic duplicate detection
- All contacts from import are added
- User must manually manage duplicates

## Export Process

### 1. Contact Selection
- User selects contacts to export (or all)
- Contacts fetched from database

### 2. vCard Generation

**For each contact**:
1. Escape special characters
2. Format name: `N:{last_name};{first_name};;;`
3. Format full name: `FN:{first_name} {last_name}`
4. Add email, phone, company, title, notes
5. Wrap in `BEGIN:VCARD` / `END:VCARD`

### 3. File Download
- All vCards concatenated into single file
- Content-Type: `text/vcard`
- Filename: `contacts.vcf`
- Browser downloads file

## Frontend Features

### Contact Management
- **Create**: Add new contacts manually
- **Edit**: Update contact information
- **Delete**: Remove contacts
- **Search**: Filter contacts by name/email/phone
- **Favorite**: Mark contacts as favorites
- **Phone Links**: Clickable `tel:` links for mobile

### UI Components
- Contact list with search
- Contact cards with hover actions
- Edit/delete buttons
- Favorite toggle
- Import/export buttons

## API Endpoints

### `GET /api/contacts`
- Returns all contacts for authenticated user
- Supports search query parameter
- Returns JSON array

### `POST /api/contacts`
- Creates new contact
- Validates required fields
- Returns created contact

### `PUT /api/contacts/:id`
- Updates existing contact
- Validates ownership (user_id check)
- Returns updated contact

### `DELETE /api/contacts/:id`
- Deletes contact
- Validates ownership
- Cascade deletes (if any related data)

### `POST /api/contacts/import`
- Accepts vCard file upload
- Parses and imports contacts
- Returns import statistics

### `GET /api/contacts/export`
- Generates vCard file
- Returns file download
- Includes all user's contacts

## Compatibility

### Supported Exports
- ✅ Google Contacts (vCard 3.0)
- ✅ Apple Contacts (vCard 3.0 with quoted-printable)
- ✅ Microsoft Outlook (vCard 3.0)
- ✅ Most standard vCard implementations

### Limitations
- Only supports vCard 3.0 (not 2.1 or 4.0)
- Single email/phone per contact (first one used)
- No photo support (vCard PHOTO property not parsed)
- No address fields (ADR property not parsed)
- No custom fields support

## Security

### Access Control
- All endpoints require authentication
- User can only access their own contacts
- Database queries filtered by `user_id`

### Data Validation
- Email format validation
- Phone number sanitization
- Name length limits
- SQL injection prevention (parameterized queries)

## Future Improvements

- Photo support (avatar images)
- Multiple emails/phones per contact
- Address fields (street, city, state, zip)
- Contact groups/categories
- Duplicate detection and merging
- vCard 4.0 support
- CSV import/export
- Contact sharing between users
