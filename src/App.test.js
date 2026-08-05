import { render, screen } from '@testing-library/react';
import App from './App';

test('renders QRM validation loading state', () => {
  render(<App />);
  expect(screen.getByText(/Se încarcă ziua protocolului/i)).toBeInTheDocument();
});
