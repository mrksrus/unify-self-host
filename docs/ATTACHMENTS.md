# Email Attachments - Technical Documentation

## Overview

UniHub handles both regular attachments (files to download) and inline attachments (images embedded in HTML emails) when syncing emails.

## Types of Attachments

### 1. Regular Attachments
- Files attached to emails (PDFs, images, documents, etc.)
- Shown in the attachments list below email content
- Downloadable via click
- Stored on filesystem, metadata in database

### 2. Inline Attachments
- Images embedded directly in HTML email body
- Referenced using `cid:` (Content-ID) scheme
- Displayed inline in the email reader
- Not shown in attachments list (already embedded)

## Storage Architecture

### Filesystem Storage
- **Location**: `/app/uploads/attachments/`
- **Naming**: `{emailId}-{attachmentId}-{filename}`
- **Format**: Binary files stored as-is (no conversion)

### Database Storage
- **Table**: `email_attachments`
- **Fields**:
  - `id`: Unique attachment ID
  - `email_id`: Link to email
  - `filename`: Original filename
  - `content_type`: MIME type (e.g., `image/png`, `application/pdf`)
  - `size_bytes`: File size in bytes
  - `storage_path`: Filesystem path to file
  - `content_id`: CID for inline attachments (null for regular)

## Processing Flow

### During Email Sync

1. **Parse Email**:
   - `mailparser` extracts attachments from email
   - Returns array of attachment objects

2. **Process Each Attachment**:
   ```
   For each attachment:
   a. Generate unique attachment ID
   b. Extract filename (or use CID for inline)
   c. Sanitize filename (remove special chars)
   d. Determine storage path
   e. Write file content to filesystem
   f. Calculate file size
   g. Insert metadata into database
   ```

3. **Handle Inline Attachments**:
   - Detect inline by checking for `contentId` or `cid` property
   - Store CID in `content_id` field
   - Replace `cid:` references in HTML with actual URLs
   - Example: `<img src="cid:image123">` → `<img src="/api/mail/attachments/abc-123">`

### HTML Processing

**Before Processing**:
```html
<img src="cid:image123@example.com">
<p>Some text</p>
```

**After Processing**:
```html
<img src="/api/mail/attachments/550e8400-e29b-41d4-a716-446655440000">
<p>Some text</p>
```

**Replacement Patterns**:
- `cid:value` → `/api/mail/attachments/{id}`
- `"cid:value"` → `/api/mail/attachments/{id}`
- `'cid:value'` → `/api/mail/attachments/{id}`

## Content Handling

### Buffer Handling
- `mailparser` provides attachments as Buffer objects
- Buffers written directly to filesystem
- Size calculated from buffer length

### Stream Handling
- Some attachments may be streams
- Streams converted to buffers before writing
- Chunks collected and concatenated

### Error Handling
- Individual attachment failures don't stop email sync
- Errors logged but sync continues
- Failed attachments skipped

## Download Endpoint

### `GET /api/mail/attachments/:id`

**Authentication**:
- Requires valid JWT token
- Verifies attachment belongs to user's email

**Process**:
1. Lookup attachment by ID
2. Verify ownership (join with emails table)
3. Read file from filesystem
4. Return file with proper content-type headers

**Response**:
- Raw file content (binary)
- Content-Type header (from database)
- Content-Disposition header (for download)

## Frontend Display

### Regular Attachments
- Shown in attachments section below email body
- Display filename, content type, and size
- Download link with paperclip icon
- Hover effects for better UX

### Inline Attachments
- Automatically displayed in HTML email body
- Loaded via `/api/mail/attachments/{id}` URL
- Browser handles image rendering
- No separate UI element needed

### Visual Indicators
- Paperclip icon next to email subject if attachments exist
- Shown in email list (all folders)
- Helps identify emails with attachments quickly

## Security Considerations

### Access Control
- Attachments only accessible to email owner
- Download endpoint verifies user ownership
- No direct filesystem access from frontend

### File Validation
- Filenames sanitized (special chars removed)
- Content-type stored but not validated
- No virus scanning (future improvement)

### Storage Limits
- No automatic cleanup
- Attachments accumulate over time
- Consider implementing cleanup policy

## Limitations

1. **No Preview**: Attachments are download-only (no in-browser preview)
2. **No Size Limits**: Large attachments may cause issues
3. **No Compression**: Files stored as-is
4. **No Virus Scanning**: Files not scanned for malware
5. **No Expiration**: Attachments never deleted automatically

## File Types Supported

All file types are supported:
- Images (PNG, JPG, GIF, etc.) - displayed inline if HTML email
- Documents (PDF, DOCX, etc.) - download only
- Archives (ZIP, RAR, etc.) - download only
- Any other file type - download only

## Future Improvements

- In-browser preview for images/PDFs
- Attachment size limits
- Virus scanning integration
- Automatic cleanup of old attachments
- Attachment compression
- Progress indicators for large downloads
