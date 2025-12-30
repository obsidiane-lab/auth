# PHP SDK - Refactoring Notes

## Status

✅ The PHP SDK remains **unchanged** and continues to work as a standalone SDK.

The focus of the refactoring was on the **JavaScript/TypeScript SDK**, which now uses **Meridiane** for code generation.

## Architecture Parity

Both SDKs maintain the same API structure:

### JavaScript SDK (New - Meridiane-based)
```typescript
import { FacadeFactory } from '@obsidiane/auth-client-js';

const factory = inject(FacadeFactory);
const users = factory.create<UserUserRead>({ url: '/api/users' });

users.getCollection$()
users.get$(id)
users.post$(item)
users.patch$(id, item)
users.delete$(id)
```

### PHP SDK (Unchanged - Manual)
```php
use Obsidiane\AuthBundle\AuthClient;

$client = new AuthClient(baseUrl: 'http://localhost:9000');
$users = $client->users();

$users->list()
$users->get($id)
$users->create($item)
$users->update($id, $item)
$users->delete($id)
```

## Keeping Sync

When the API changes, **both SDKs should be updated**:

### JavaScript SDK
```bash
# Auto-updated via Meridiane
make sdk-npm
```

### PHP SDK
**Manual update required** - add new endpoints to the PHP Endpoint classes:

1. Edit `src/Endpoint/AuthEndpoint.php` (or appropriate file)
2. Add new method following existing pattern
3. Match JavaScript SDK's method signature and behavior
4. Update `src/Auth/Types.php` for response type helpers if needed

## Example: Adding New Endpoint

If the backend adds `POST /api/auth/change-password`:

### JavaScript SDK (Auto)
```typescript
// Automatically in src/ after 'make sdk-npm'
// No manual changes needed
```

### PHP SDK (Manual)
```php
// Add to src/Endpoint/AuthEndpoint.php
public function changePassword(string $currentPassword, string $newPassword): array {
  return $this->http->requestJson('POST', '/api/auth/change-password', [
    'headers' => $this->buildRequiredCsrfHeaders(),
    'json' => [
      'currentPassword' => $currentPassword,
      'newPassword' => $newPassword,
    ],
  ]);
}
```

## CSRF in PHP SDK

The PHP SDK already has CSRF built into `src/Http/HttpClient.php`:

```php
public function generateCsrfToken(): string {
  return bin2hex(random_bytes(16));
}
```

This is **equivalent** to the JavaScript SDK's CSRF implementation.

## Maintenance Strategy

### When API Changes

1. **Regenerate JavaScript SDK**:
   ```bash
   make sdk-npm
   ```

2. **Check what changed**:
   ```bash
   git diff packages/auth-client-js/src/
   ```

3. **Apply same changes to PHP SDK**:
   - Review new endpoints in JavaScript
   - Add corresponding methods to PHP Endpoint classes
   - Ensure method names and signatures match

4. **Test both SDKs**:
   ```bash
   # JavaScript
   cd packages/auth-client-js && npm run build

   # PHP
   cd packages/auth-client-php && composer test
   ```

## Future: Auto-Generation for PHP

Possible future enhancement: Generate PHP SDK from OpenAPI using a tool like:
- [OpenAPI Generator](https://openapi-generator.tech/) (PHP target)
- Custom Meridiane PHP generator (if feasible)

This would achieve **100% parity** between JS and PHP SDKs.

## Current Strengths

✅ Both SDKs cover all API endpoints
✅ Both implement CSRF protection
✅ Both have clean, testable code
✅ Both support dependency injection (Angular for JS, Symfony for PHP)
✅ Both are lightweight with minimal dependencies

## Maintenance Checklist

- [ ] When API changes: `make sdk-npm`
- [ ] Check diff: `git diff packages/auth-client-js/src/`
- [ ] Update PHP SDK manually
- [ ] Test both
- [ ] Commit both
- [ ] Update version numbers if publishing

---

For more details on the JavaScript SDK refactoring, see: **SDK_REFACTORING_SUMMARY.md**
