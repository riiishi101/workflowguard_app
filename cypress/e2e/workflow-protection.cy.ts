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
        cy.get('@locationAssignStub').should('have.been.calledWith', Cypress.sinon.match('app.hubspot.com/oauth'));


    // 3. Simulate a successful OAuth callback
    // Manually visit the callback URL with a mock token
    cy.visit('/?success=true&token=mock_jwt_token');


    // 4. Verify successful login
    // After the simulated callback, the user should be on the workflow selection page
    cy.contains('h1', 'Select Your Workflows', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Start Monitoring').should('be.visible');
  });


  it('should allow a user to protect workflows', () => {
    // Mock the API response for fetching workflows
    cy.intercept('GET', '/api/workflow/hubspot', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { 
            id: 'wf-1', 
            hubspotId: 'hs-wf-1', 
            name: 'Test Workflow 1', 
            folder: 'Test Folder',
            status: 'ACTIVE',
            lastModified: '2024-01-01T00:00:00Z',
            steps: 5,
            contacts: 100,
            isProtected: false 
          },
          { 
            id: 'wf-2', 
            hubspotId: 'hs-wf-2', 
            name: 'Test Workflow 2', 
            folder: 'Test Folder',
            status: 'ACTIVE',
            lastModified: '2024-01-01T00:00:00Z',
            steps: 3,
            contacts: 50,
            isProtected: false 
          },
        ],
      },
    }).as('getWorkflows');

    // Intercept the backend call to protect workflows
    cy.intercept('POST', '/api/workflow/start-protection', {
      statusCode: 200,
      body: { 
        success: true,
        message: 'Workflow protection started successfully',
        data: []
      },
    }).as('protectWorkflows');

    // Start at the root and log in
    cy.visit('/');
    cy.contains('button', 'Get Started').click();
    cy.contains('button', 'Connect to HubSpot').click();
    cy.visit('/?success=true&token=mock_jwt_token');

    // Wait for the workflows to be loaded
    cy.wait('@getWorkflows');

    // Select the first workflow using checkbox
    cy.get('[data-testid="workflow-checkbox-wf-1"]').check();

    // Click the "Start Protecting" button
    cy.contains('button', 'Start Protecting').click();

    // Verify that the protectWorkflows API was called with the correct data
    cy.wait('@protectWorkflows').its('request.body').should('deep.equal', {
      workflows: [
        {
          id: 'wf-1',
          hubspotId: 'wf-1',
          name: 'Test Workflow 1'
        }
      ]
    });

    // Verify navigation to dashboard
    cy.url().should('include', '/dashboard');
  });
});
