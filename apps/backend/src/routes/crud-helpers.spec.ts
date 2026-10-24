import { describe, expect, it } from 'vitest';
import { SYSTEM_USER, withAudit } from './crud-helpers.js';

describe('withAudit (injeção de auditoria do CRUD)', () => {
  it('preenche user_created, user_updated e active na criação', () => {
    const prepared = withAudit({ name: 'Registro' });
    expect(prepared.userCreated).toBe(SYSTEM_USER);
    expect(prepared.userUpdated).toBe(SYSTEM_USER);
    expect(prepared.active).toBe(true);
    expect(typeof prepared.id).toBe('string');
    expect((prepared.id as string).length).toBe(36);
  });

  it('não sobrescreve id nem active informados', () => {
    const prepared = withAudit({ id: 'id-informado', active: false });
    expect(prepared.id).toBe('id-informado');
    expect(prepared.active).toBe(false);
    expect(prepared.userCreated).toBe(SYSTEM_USER);
  });
});
