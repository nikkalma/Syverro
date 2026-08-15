import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TelegramLogin from './TelegramLogin';

describe('TelegramLogin', () => {
  it('loads the domain-linked widget and requests bot write access', () => {
    const onAuth = vi.fn();
    const { container } = render(<TelegramLogin onAuth={onAuth} />);
    const script = container.querySelector('script');

    expect(script).toHaveAttribute('src', 'https://telegram.org/js/telegram-widget.js?22');
    expect(script).toHaveAttribute('data-telegram-login', 'SyverroBot');
    expect(script).toHaveAttribute('data-request-access', 'write');
    expect(script).toHaveAttribute('data-onauth', 'onSyverroTelegramAuth(user)');

    const payload = {
      id: '123',
      first_name: 'Ada',
      auth_date: 1_800_000_000,
      hash: 'signed-hash',
    };
    window.onSyverroTelegramAuth?.(payload);
    expect(onAuth).toHaveBeenCalledWith(payload);
  });
});
