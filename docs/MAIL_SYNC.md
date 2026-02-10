# Mail Sync - Technical Documentation

## Overview

UniHub implements email synchronization using the IMAP protocol to fetch emails from external email providers (Gmail, Apple/iCloud, Yahoo, etc.) and store them locally in the database.

## Architecture

### Components

- **IMAP Client**: `imap-simple` library for connecting to IMAP servers
- **Email Parser**: `mailparser` library for parsing RFC822 email format
- **Database**: MySQL tables (`mail_accounts`, `emails`, `email_attachments`)
- **Encryption**: AES-256-GCM for storing email account passwords

## Sync Process

### 1. Account Setup

When a user adds a mail account:
- Credentials are encrypted using AES-256-GCM before storage
- IMAP/SMTP settings are auto-filled based on provider (Gmail, Yahoo, etc.)
- Initial sync is triggered immediately after account creation

### 2. Email Fetching Strategy

**One-by-One Fetching**:
- Fetches emails individually by UID (not in batches)
- Processes last 500 emails (most recent first)
- No timeout limits - sync continues until complete
- Real-time progress logging for debugging

**Why One-by-One?**
- More reliable for large mailboxes
- Better error handling (one bad email doesn't break entire sync)
- Real-time progress visibility
- Avoids timeout issues with batch operations

### 3. Sync Flow

```
1. Connect to IMAP server (port 993 for TLS, 143 for STARTTLS)
2. Authenticate with username/password (App Password for Gmail/Yahoo)
3. Open INBOX folder
4. Search for all message UIDs (fast operation)
5. Extract last 500 UIDs
6. For each UID:
   a. Fetch email with HEADER and TEXT parts
   b. Reconstruct full email (RFC822 format)
   c. Parse with mailparser
   d. Extract metadata (subject, from, to, date, body)
   e. Check for duplicates (by message_id)
   f. Save to database
   g. Process attachments (if any)
7. Update last_synced_at timestamp
8. Close connection
```

### 4. Email Parsing

**Reconstruction Process**:
- IMAP returns HEADER and TEXT parts separately
- Headers are parsed into objects by `imap-simple`
- Headers are reconstructed into RFC822 format for `mailparser`
- Full email string is created: `headerContent + '\r\n\r\n' + bodyContent`

**Parsed Data**:
- Subject, From (name + address), To addresses
- Body text (plain text)
- Body HTML (if available)
- Attachments (regular and inline)
- Message ID (for duplicate detection)
- Date received

### 5. Duplicate Detection

- Uses `message_id` field (unique per email)
- Checks if email already exists before inserting
- Prevents re-syncing the same email multiple times
- Works across syncs (10-minute automatic syncs)

### 6. Automatic Sync

- Runs every 10 minutes in the background
- Only syncs accounts that belong to the current user
- Each account syncs independently
- Syncs are separated by user and by account

## Database Schema

### `mail_accounts` Table
- Stores email account credentials (encrypted)
- IMAP/SMTP server settings
- Last sync timestamp
- User association

### `emails` Table
- Stores email metadata and content
- Links to `mail_accounts` via `mail_account_id`
- Links to `users` via `user_id`
- Folder support (inbox, sent, archive, trash)
- Read/unread and starred status

### `email_attachments` Table
- Stores attachment metadata
- File path to actual attachment file
- Links to `emails` via `email_id`
- Content-ID for inline attachments

## Security

### Password Encryption
- Uses AES-256-GCM encryption
- Encryption key stored in environment variable
- Passwords never stored in plain text
- Decrypted only when needed for IMAP/SMTP connections

### App Passwords
- Gmail/Yahoo/iCloud require App Passwords (not regular passwords)
- Users must generate App Passwords in their account settings
- App Passwords are used for IMAP/SMTP authentication

## Error Handling

### Connection Errors
- Timeout handling (60s connection, 30s auth)
- TLS certificate validation (can be disabled for debugging)
- SNI (Server Name Indication) support
- Detailed error messages for troubleshooting

### Sync Errors
- Individual email failures don't stop entire sync
- Errors logged with detailed debug information
- Failed emails are skipped, sync continues
- Error count tracked and reported

## Performance Considerations

### Fetching Strategy
- Only fetches last 500 emails (not all emails)
- Uses HEADER + TEXT parts (not full message) for performance
- One-by-one fetching prevents memory issues
- No timeout limits (sync can take hours for large mailboxes)

### Storage
- Emails stored in database (text/HTML in LONGTEXT columns)
- Attachments stored on filesystem (`/app/uploads/attachments/`)
- No automatic cleanup (emails accumulate over time)

## Limitations

1. **Email Limit**: Only syncs last 500 emails per account
2. **No Incremental Sync**: Always checks last 500 (not just new emails)
3. **No Folder Sync**: Only syncs INBOX (other folders not supported)
4. **No Server Deletion**: Deletes are local-only (not synced to server)
5. **Slow for Large Mailboxes**: One-by-one fetching can be slow (10+ seconds per email)

## Future Improvements

- Incremental sync (only fetch new emails since last sync)
- Folder support (sync Sent, Archive, etc.)
- Server-side deletion sync
- Batch fetching optimization
- Email search/filtering improvements
