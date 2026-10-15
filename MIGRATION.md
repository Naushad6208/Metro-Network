# Existing localStorage data migration

The old HTML stored data under:

- `metroPwayPortal_v6`
- `metroPwayUsers_v1`
- `metroPwayRecovery_v1`
- `metroPwayHero_v1`

The new application does not use these keys for normal operation.

Before switching production completely, open the old portal in the same browser and export these values from DevTools:

```js
copy(JSON.stringify({
  data: JSON.parse(localStorage.getItem('metroPwayPortal_v6')),
  users: JSON.parse(localStorage.getItem('metroPwayUsers_v1') || '[]'),
  recoveryCode: localStorage.getItem('metroPwayRecovery_v1') || '',
  hero: JSON.parse(localStorage.getItem('metroPwayHero_v1') || 'null')
}))
```

Save the copied JSON securely. Do not publish it because the old user records contain plain-text passwords.

For production migration, insert the portal data into the `portals` document and recreate users through the backend API so passwords are bcrypt-hashed. Do not directly put old plain-text passwords into MongoDB.

