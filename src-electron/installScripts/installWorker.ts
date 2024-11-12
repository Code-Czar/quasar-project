const { installDependencies } = require('./install');

process.on('message', async (data) => {
  try {
    const result = await installDependencies(data.productId);
    process.send(result);
  } catch (error) {
    process.send({ error: error.message });
  } finally {
    process.exit();
  }
});
