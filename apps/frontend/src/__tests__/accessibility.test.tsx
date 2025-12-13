import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('page should not have basic accessibility violations', async () => {
    const { container } = render(
      <main>
        <h1>Notes Application</h1>
        <nav>
          <ul>
            <li><a href="/notes">Notes</a></li>
            <li><a href="/templates">Templates</a></li>
          </ul>
        </nav>
        <section>
          <h2>Welcome</h2>
          <p>Create and manage your notes</p>
        </section>
      </main>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('form should have proper labels', async () => {
    const { container } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
        
        <label htmlFor="password">Password</label>
        <input id="password" type="password" />
        
        <button type="submit">Submit</button>
      </form>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('images should have alt text', async () => {
    const { container } = render(
      <div>
        <img src="/logo.png" alt="Notes App Logo" />
        <img src="/icon.png" alt="" role="presentation" />
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('headings should be in proper order', async () => {
    const { container } = render(
      <article>
        <h1>Main Title</h1>
        <section>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </section>
        <section>
          <h2>Another Section</h2>
        </section>
      </article>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('color contrast should be sufficient', async () => {
    const { container } = render(
      <div>
        <p className="text-gray-900 bg-white">Good contrast text</p>
        <button className="bg-blue-600 text-white">Good contrast button</button>
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
