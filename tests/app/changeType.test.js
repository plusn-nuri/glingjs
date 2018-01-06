var ChangeType = require("../../src/app/changeType");

describe('Change Type', () => {
  test('create is 0', () => {
    expect(ChangeType.create).toBe(0);
  });

  test('update is 1', () => {
    expect(ChangeType.update).toBe(1);
  });

  test('remove is 2', () => {
    expect(ChangeType.remove).toBe(2);
  });
});