import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { PolotnoAnimationsPanel } from '../components/PolotnoAnimationsPanel';

jest.mock('mobx-react-lite', () => ({
  observer: (component) => component
}));

describe('PolotnoAnimationsPanel', () => {
  test('guarda custom.animation sobre el elemento seleccionado', () => {
    const set = jest.fn();
    const store = {
      selectedElements: [
        {
          id: 'text-1',
          custom: {},
          set
        }
      ],
      history: {
        transaction: (callback) => callback?.()
      }
    };

    render(<PolotnoAnimationsPanel store={store} onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /pulso/i }));
    fireEvent.click(screen.getByRole('button', { name: /aplicar animacion/i }));

    expect(set).toHaveBeenCalledWith({
      custom: {
        animation: {
          type: 'pulse',
          duration: 2000,
          delay: 0,
          loop: true
        }
      }
    });
  });
});
