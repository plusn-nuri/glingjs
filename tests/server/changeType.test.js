var ChangeType = require("../../src/changeType");

describe('Change Type', () => {
  test('create is string "create"', () => {
    expect(ChangeType.create).toBe('create');
  });

  test('update is string "update"', () => {
    expect(ChangeType.update).toBe('update');
  });

  test('remove is string "remove"', () => {
    expect(ChangeType.remove).toBe('remove');
  });
});