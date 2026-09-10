import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavLogo from './NavLogo';

const wrap = () => render(<MemoryRouter><NavLogo /></MemoryRouter>);

describe('NavLogo', () => {
    it('FINANS + PORTAL wordmark render', () => {
        wrap();
        expect(screen.getByText('FINANS')).toBeInTheDocument();
        expect(screen.getByText('PORTAL')).toBeInTheDocument();
    });

    it('logo img tag /finanslogo.png + alt', () => {
        const { container } = wrap();
        const img = container.querySelector('img');
        expect(img.src).toContain('finanslogo.png');
        expect(img.alt).toBe('FinansPortal');
    });

    it('link "/" yönlendirir', () => {
        const { container } = wrap();
        const link = container.querySelector('a');
        expect(link.getAttribute('href')).toBe('/');
    });
});
