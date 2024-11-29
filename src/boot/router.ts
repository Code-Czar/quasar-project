import { boot } from 'quasar/wrappers';

export default boot(({ router }) => {
  // Expose the router globally for Electron preload access
  window.router = router;
});
