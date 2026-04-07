# Authentication Reference

## Login

```bash
pcms auth login --domain https://example.com --email admin@example.com
# password prompted interactively
```

With explicit password (for scripts):

```bash
pcms auth login --domain https://example.com --email admin@example.com --password 'mypassword'
```

Credentials stored at `~/.config/pcms/credentials.json` (permissions 0600).

## Multi-instance profiles

```bash
# Login to staging
pcms auth login --domain https://staging.example.com --email admin@example.com

# Login to production
pcms auth login --domain https://prod.example.com --email admin@example.com

# List all profiles
pcms auth profiles

# Use a specific profile for a command
pcms documents list posts --domain https://staging.example.com
```

The last logged-in domain becomes the default.

## Status

```bash
# Show active profile
pcms auth status

# Show authenticated user details
pcms auth me
```

## Logout

```bash
# Remove default profile
pcms auth logout

# Remove specific profile
pcms auth logout --domain https://staging.example.com
```

## Troubleshooting

- **"No profile configured"** — run `pcms auth login`
- **HTTP 401** — token expired, re-run `pcms auth login`
- **Connection refused** — check the domain URL, make sure the Payload instance is running
