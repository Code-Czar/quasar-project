const { installDependencies: installDependencies_ } = require('./install');

process.on('message', async (data: { productId: string }) => {
  try {
    console.log('🚀 ~ process.on ~ installer:', installDependencies_);
    const result = await installDependencies_(data.productId);
    process.send!(result);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ingore error type
    process.send!({ error: error.message });
  } finally {
    process.exit();
  }
});
