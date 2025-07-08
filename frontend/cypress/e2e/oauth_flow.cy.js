// Cypress E2E test for HubSpot OAuth flow error handling

describe('HubSpot OAuth Flow Error Handling', () => {
  it('shows error for missing code parameter', () => {
    cy.visit('https://workflowguard-app.onrender.com/api/auth/callback', { failOnStatusCode: false });
    cy.url().should('include', '/?oauth_error=');
    cy.contains('Missing code parameter').should('be.visible');
  });

  it('shows error for invalid code', () => {
    // Simulate callback with an invalid code
    cy.visit('https://workflowguard-app.onrender.com/api/auth/callback?code=INVALID_CODE', { failOnStatusCode: false });
    cy.url().should('include', '/?oauth_error=');
    cy.contains('Failed to exchange code for access token').should('be.visible');
  });

  // Add more tests for other error scenarios as needed
}); 