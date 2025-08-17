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

  it('should allow a user to protect a workflow', () => {
    // Mock the API response for fetching workflows
    cy.intercept('GET', '/api/workflow/hubspot', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 'wf-1', hubspotId: 'hs-wf-1', name: 'Test Workflow 1', isProtected: false },
          { id: 'wf-2', hubspotId: 'hs-wf-2', name: 'Test Workflow 2', isProtected: false },
        ],
      },
    }).as('getWorkflows');

    // Intercept the backend call to protect a workflow
    cy.intercept('POST', '/api/actions/protect-workflow', {
      statusCode: 200,
      body: { success: true },
    }).as('protectWorkflow');

    // Start at the root and log in
    cy.visit('/');
    cy.contains('button', 'Get Started').click();
    cy.contains('button', 'Connect to HubSpot').click();
    cy.visit('/?success=true&token=mock_jwt_token');

    // Wait for the workflows to be loaded
    cy.wait('@getWorkflows');

    // Find the first workflow and click its 'Protect' button
    // Note: The selector used here is a placeholder and might need to be adjusted based on the actual frontend implementation.
    cy.contains('td', 'Test Workflow 1')
      .parent('tr')
      .within(() => {
        cy.contains('button', 'Protect').click();
      });

    // Verify that the protectWorkflow API was called with the correct data
    cy.wait('@protectWorkflow').its('request.body').should('deep.equal', {
      workflowId: 'hs-wf-1',
    });
  });
});

