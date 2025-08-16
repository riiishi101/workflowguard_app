/// <reference types="cypress" />

describe('Workflow Protection', () => {
  it('should simulate HubSpot OAuth flow and land on the workflow selection page', () => {
    // Start at the root of the application
    cy.visit('/');

    // 1. Handle the Welcome Modal
    cy.contains('h1', 'Welcome to WorkflowGuard!', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Get Started').click();

    // 2. Handle the Connect HubSpot Modal
    cy.contains('h1', 'Connect Your HubSpot Account').should('be.visible');

    // Intercept the redirection to HubSpot
    cy.window().then((win) => {
      // Stub the window.location.href to prevent the test from navigating away
      cy.stub(win.location, 'assign').as('locationAssignStub');
    });

    // Click the button that triggers the HubSpot OAuth flow
    cy.contains('button', 'Connect to HubSpot').click();

    // Assert that the app tried to redirect to HubSpot
    cy.get('@locationAssignStub').should('have.been.calledWith', Cypress.sinon.match.string.that.includes('app.hubspot.com/oauth'));

    // 3. Simulate a successful OAuth callback
    // Manually visit the callback URL with a mock token
    cy.visit('/?success=true&token=mock_jwt_token');

    // 4. Verify successful login
    // After the simulated callback, the user should be on the workflow selection page
    cy.contains('h1', 'Select Your Workflows', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Start Monitoring').should('be.visible');
  });
});

