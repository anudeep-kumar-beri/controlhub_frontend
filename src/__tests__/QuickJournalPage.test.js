import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickJournalPage from '../pages/QuickJournalPage';

jest.mock('axios', () => {
  const mock = {
    get: jest.fn(() => Promise.resolve({ data: { text: 'hello', updatedAt: new Date().toISOString() } })),
    post: jest.fn(() => Promise.resolve({ data: { updatedAt: new Date().toISOString() } })),
    delete: jest.fn(() => Promise.resolve({}))
  };
  return { __esModule: true, default: mock };
});

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
    internal: { pageSize: { height: 297 } }
  }));
});

 

describe('QuickJournalPage', () => {
  it('allows typing into the journal textarea', async () => {
    render(<QuickJournalPage />);
    const textarea = await screen.findByPlaceholderText('Write something reflective or important...');

    // Ensure it's focusable and accepts input (not blocked by any overlay)
    await userEvent.click(textarea);
    await userEvent.type(textarea, ' testing input');

    expect(textarea.value).toContain('testing input');
  });
});
