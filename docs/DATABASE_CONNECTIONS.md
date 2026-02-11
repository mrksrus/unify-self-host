# Database Connection Pool Explanation

## What is the Connection Pool?

The connection pool is between your **Node.js backend server** and the **MySQL database** (not between client browser and frontend). It's a pool of reusable database connections that the server uses to execute queries.

## How Connections Work

### Single Login Example:
When a user logs in, the backend typically uses **2-3 connections** (briefly, one at a time):
1. `SELECT user FROM users WHERE email = ?` - Uses connection #1
2. `INSERT INTO sessions ...` - Uses connection #2 (or reuses #1 if it's free)
3. Connection is released back to pool immediately after query completes

**So a single login = 2-3 database queries = 2-3 connections used sequentially (not simultaneously)**

### What Causes Multiple Connections?

1. **Concurrent Requests**: If 5 users log in at the same time, you might use 5 connections simultaneously
2. **Mail Syncs**: These are the BIGGEST consumers:
   - Each mail sync runs for several minutes
   - During sync, it executes many database queries (one per email)
   - Each query holds a connection briefly, but with hundreds of emails, connections are in constant use
   - **Multiple mail accounts syncing = multiple connections held longer**
3. **Contacts Import**: Large vCard imports can use a connection for a while (one INSERT per contact)
4. **Background Operations**: Periodic syncs, session cleanup, etc.

## Connection Limit: 50

We set the limit to **50 connections** because:
- Normal operations (login, viewing emails, etc.) use 1-2 connections briefly
- Mail syncs can hold connections for minutes while processing emails
- With 50 connections, you can handle:
  - ~20-25 concurrent mail syncs
  - Plus normal user requests
  - Plus background operations
  - Provides headroom for peak usage scenarios

## Why Connections Stack Up

Connections can accumulate if:
1. **Long-running operations** (mail syncs) hold connections for extended periods
2. **Failed queries** don't release connections properly (now fixed with retry logic)
3. **Connection leaks** from unhandled errors (now fixed with better error handling)
4. **Idle connections** that should timeout but don't (now fixed with `idleTimeout`)

## Cleanup Every 15 Minutes

The health check runs every 15 minutes to:
- Test if the pool is still healthy
- Log connection usage statistics
- Detect if connections are piling up
- Attempt reconnection if the pool is broken

This helps prevent the 502 errors by catching connection issues early.

## Summary

- **Connection pool = Backend ↔ MySQL** (not browser ↔ frontend)
- **Single login = 2-3 queries = 2-3 connections used briefly**
- **Mail syncs = Biggest connection consumer** (can hold connections for minutes)
- **Limit of 50 = Safe for normal use + multiple syncs + peak usage**
- **Cleanup every 15 min = Prevents connection buildup**
