# TODO

## Security

- [ ] Move `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` from `eas.json` to EAS Secrets for better security
  ```bash
  eas secret:create --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --scope project --value "sk.eyJ1..."
  ```
  Then remove it from `eas.json` (the other tokens are designed to be public)

## Technical Debt

- [ ] Remove duplicate `calculateDistance` function (exists in both `src/lib/location.ts` and `src/stores/missionStore.ts`)
