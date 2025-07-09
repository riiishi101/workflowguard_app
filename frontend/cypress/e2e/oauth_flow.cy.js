// Cypress E2E test for HubSpot OAuth flow error handling

describe('HubSpot OAuth Flow Error Handling', () => {
  it('redirects with error for missing code parameter', () => {
    cy.request({
      url: 'https://workflowguard-app.onrender.com/api/auth/callback',
      failOnStatusCode: false,
      followRedirect: false,
    }).then((resp) => {
      // Accepts 302 or 308 depending on backend config
      expect([302, 308]).to.include(resp.status);
      expect(resp.redirectedToUrl).to.include('/?oauth_error=');
      expect(decodeURIComponent(resp.redirectedToUrl)).to.include('Missing code parameter');
    });
  });

  it('redirects with error for invalid code', () => {
    cy.request({
      url: 'https://workflowguard-app.onrender.com/api/auth/callback?code=INVALID_CODE',
      failOnStatusCode: false,
      followRedirect: false,
    }).then((resp) => {
      expect([302, 308]).to.include(resp.status);
      expect(resp.redirectedToUrl).to.include('/?oauth_error=');
      expect(decodeURIComponent(resp.redirectedToUrl)).to.include('Failed to exchange code for access token');
    });
  });

  it('shows error message on frontend when oauth_error param is present (missing code)', () => {
    cy.visit('https://www.workflowguard.pro/?oauth_error=Missing%20code%20parameter.%20Please%20try%20connecting%20to%20HubSpot%20again%20from%20the%20app.');
    cy.get('[data-testid="oauth-error"]').should('contain', 'Missing code parameter');
  });

  it('shows error message on frontend when oauth_error param is present (invalid code)', () => {
    cy.visit('https://www.workflowguard.pro/?oauth_error=Failed%20to%20exchange%20code%20for%20access%20token.%20Please%20try%20again%20or%20contact%20support.');
    cy.get('[data-testid="oauth-error"]').should('contain', 'Failed to exchange code for access token');
  });

  // Add more tests for other error scenarios as needed
}); 