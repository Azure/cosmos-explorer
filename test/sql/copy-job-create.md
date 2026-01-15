# Copy Job Creation Test Plan

## Application Overview

This test plan covers comprehensive testing of the Copy Job Creation flow in the Azure CosmosDB Portal. The feature allows users to create container copy jobs for migrating data between Cosmos DB containers with support for both online and offline migration modes. Testing focuses on UI validation, form submission, error handling, and end-to-end workflow verification.

## Test Scenarios

### 1. Copy Job Creation - Happy Path

**Seed:** `test/sql/copyjob.seed.spec.ts`

#### 1.1. Create Offline Copy Job Successfully

**File:** `tests/copy-job-creation/create-offline-copy-job-success.spec.ts`

**Steps:**
  1. Wait for the copy job screen to load
  2. Click 'Create Copy Job' button with data-test='CommandBar/Button:Create Copy Job'
  3. Verify side panel opens with data-test='Panel:Create copy job'
  4. Verify panel header contains 'Create copy job' text
  5. Wait for subscription dropdown with data-test='subscription-dropdown' to populate
  6. Wait for account dropdown with data-test='account-dropdown' to populate
  7. Verify 'Offline mode' radio button is enabled and selected by default
  8. Verify offline mode description with data-test='migration-type-description-offline' is visible
  9. Click 'Next' button to proceed to container selection
  10. Verify SelectSourceAndTargetContainers panel with data-test='Panel:SelectSourceAndTargetContainers' is visible
  11. Select first option from source database dropdown with data-test='source-databaseDropdown'
  12. Select first option from source container dropdown with data-test='source-containerDropdown'
  13. Select first option from target database dropdown with data-test='target-databaseDropdown'
  14. Select first option from target container dropdown with data-test='target-containerDropdown'
  15. Verify error message appears at top of panel for same source and target selection
  16. Select second option from target container dropdown to resolve error
  17. Click 'Next' button to proceed to preview
  18. Verify preview page displays selected source subscription, account, database and container
  19. Enter valid job name in job name input field
  20. Click 'Submit' button to create copy job
  21. Wait for API response indicating successful job creation
  22. Verify job appears in jobs list with correct name
  23. Verify side panel is closed after successful submission

**Expected Results:**
  - Copy job screen loads successfully
  - Create Copy Job button is visible and clickable
  - Side panel opens with correct title
  - Panel header displays 'Create copy job'
  - Subscription dropdown populates with available subscriptions
  - Account dropdown populates with available accounts
  - Offline mode radio button is enabled and selected
  - Offline mode description is visible and contains expected text
  - Navigation to container selection screen is successful
  - Source and target container selection panel is displayed
  - Database and container dropdowns populate with available options
  - Validation error is displayed for identical source and target containers
  - Error is resolved when different target container is selected
  - Navigation to preview screen is successful
  - Preview displays accurate selection details
  - Job name can be entered without restrictions
  - Copy job is successfully created via API
  - New job appears in the monitoring list
  - Side panel closes indicating completed workflow

#### 1.2. Create Online Copy Job Successfully

**File:** `tests/copy-job-creation/create-online-copy-job-success.spec.ts`

**Steps:**
  1. Wait for the copy job screen to load
  2. Click 'Create Copy Job' button
  3. Verify side panel opens
  4. Select 'Online mode' radio button
  5. Verify online mode description with data-test='migration-type-description-online' is visible
  6. Click 'Next' button
  7. Verify permissions assignment panel with data-test='Panel:AssignPermissionsContainer' is displayed
  8. Complete permissions assignment process
  9. Navigate to container selection screen
  10. Select source database and container
  11. Select different target database and container
  12. Navigate to preview screen
  13. Verify all selected details are accurate
  14. Enter valid job name
  15. Submit copy job creation
  16. Verify successful job creation and list update

**Expected Results:**
  - Online mode selection triggers permissions workflow
  - Permissions assignment panel is displayed correctly
  - Online copy job is created successfully
  - Job appears in list with online mode indicator
  - All workflow steps complete without errors

### 2. Copy Job Creation - Validation & Error Handling

**Seed:** `test/sql/copyjob.seed.spec.ts`

#### 2.1. Validate Required Field Errors

**File:** `tests/copy-job-creation/required-field-validation.spec.ts`

**Steps:**
  1. Open Create Copy Job panel
  2. Attempt to click 'Next' without selecting subscription
  3. Verify validation error for subscription field
  4. Select subscription but leave account unselected
  5. Attempt to proceed and verify account validation error
  6. Select account and proceed to container selection
  7. Attempt to proceed without selecting source database
  8. Verify source database validation error
  9. Select source database but leave container unselected
  10. Verify source container validation error
  11. Complete source selection but leave target unselected
  12. Verify target selection validation errors
  13. Complete all selections but proceed to preview with empty job name
  14. Verify job name validation error with data-test='Panel:ErrorContainer'

**Expected Results:**
  - Subscription selection is enforced
  - Account selection is required after subscription selection
  - Source database selection is mandatory
  - Source container selection is mandatory
  - Target database and container selection is mandatory
  - Job name is required and properly validated
  - All validation messages are clear and actionable

#### 2.2. Validate Job Name Input Restrictions

**File:** `tests/copy-job-creation/job-name-validation.spec.ts`

**Steps:**
  1. Navigate through copy job creation to preview screen
  2. Test job name with special characters (!@#$%^&*())
  3. Verify validation error for invalid characters
  4. Test job name with spaces at beginning and end
  5. Verify whitespace handling
  6. Test extremely long job name (>100 characters)
  7. Verify length validation
  8. Test job name with only numbers
  9. Test job name starting with hyphen or underscore
  10. Test valid job name with alphanumeric, hyphens, and underscores
  11. Verify successful submission with valid name

**Expected Results:**
  - Special characters trigger appropriate validation error
  - Whitespace is handled according to business rules
  - Length restrictions are enforced
  - Numeric-only names are handled correctly
  - Valid naming patterns are accepted
  - Job creation succeeds with properly formatted name

#### 2.3. Handle Same Source and Target Selection Error

**File:** `tests/copy-job-creation/same-source-target-validation.spec.ts`

**Steps:**
  1. Complete subscription and account selection
  2. Navigate to container selection screen
  3. Select same database for both source and target
  4. Select same container for both source and target
  5. Attempt to proceed to next screen
  6. Verify error message appears with data-test='Panel:ErrorContainer'
  7. Verify error message content indicates source and target cannot be identical
  8. Change target container to different option
  9. Verify error message disappears
  10. Verify 'Next' button becomes enabled
  11. Successfully proceed to preview screen

**Expected Results:**
  - Identical source and target selection triggers validation error
  - Error message clearly explains the restriction
  - Error is dynamically resolved when selection changes
  - Navigation is blocked while validation error persists
  - Navigation resumes once valid selections are made

#### 2.4. Handle Network and API Errors

**File:** `tests/copy-job-creation/api-error-handling.spec.ts`

**Steps:**
  1. Complete entire copy job creation flow
  2. Mock API failure for job creation request
  3. Submit copy job with valid data
  4. Verify error message appears in panel
  5. Verify panel remains open for retry
  6. Mock network timeout scenario
  7. Verify appropriate timeout error handling
  8. Mock authentication error response
  9. Verify auth error is handled gracefully
  10. Restore normal API behavior
  11. Verify successful submission after resolving API issues

**Expected Results:**
  - API errors are caught and displayed to user
  - Error messages are informative and actionable
  - Panel remains accessible for retry attempts
  - Different error types are handled appropriately
  - Recovery flow works after resolving issues

### 3. Copy Job Creation - Edge Cases & Boundary Testing

**Seed:** `test/sql/copyjob.seed.spec.ts`

#### 3.1. Handle Large Numbers of Containers

**File:** `tests/copy-job-creation/large-container-lists.spec.ts`

**Steps:**
  1. Set up test account with 50+ databases and containers
  2. Open copy job creation panel
  3. Navigate to container selection
  4. Test dropdown performance with large lists
  5. Verify search/filter functionality in dropdowns
  6. Verify scrolling behavior in dropdown menus
  7. Select containers from end of large lists
  8. Complete job creation with selections from large datasets

**Expected Results:**
  - Dropdowns handle large datasets without performance issues
  - Search/filter functionality works correctly
  - Scrolling in dropdowns is smooth and responsive
  - Selections from any position in large lists work correctly
  - Job creation completes successfully with large dataset selections

#### 3.2. Test Unicode and International Characters

**File:** `tests/copy-job-creation/unicode-character-handling.spec.ts`

**Steps:**
  1. Navigate to job name input in preview screen
  2. Test job name with Chinese characters (测试工作)
  3. Test job name with Arabic characters (اختبار)
  4. Test job name with emoji characters (📁💾)
  5. Test job name with accented characters (café résumé)
  6. Test mixed unicode and ASCII characters
  7. Verify display and storage of unicode job names
  8. Submit jobs with various unicode names
  9. Verify unicode names appear correctly in jobs list

**Expected Results:**
  - Unicode characters are handled correctly in input fields
  - Job names with international characters are accepted
  - Unicode names display correctly throughout UI
  - Jobs with unicode names are created successfully
  - Unicode job names appear correctly in monitoring list

#### 3.3. Test Browser Compatibility Features

**File:** `tests/copy-job-creation/browser-compatibility.spec.ts`

**Steps:**
  1. Test copy job creation with browser back/forward navigation
  2. Verify panel state preservation during navigation
  3. Test browser refresh during copy job creation
  4. Verify appropriate handling of page refresh
  5. Test browser zoom levels (50%, 150%, 200%)
  6. Verify UI scaling and usability at different zoom levels
  7. Test with browser developer tools open
  8. Verify functionality with reduced viewport size

**Expected Results:**
  - Browser navigation doesn't break the copy job flow
  - Panel state is preserved appropriately
  - Page refresh handling is graceful
  - UI remains functional at various zoom levels
  - Responsive design adapts to different viewport sizes

#### 3.4. Test Concurrent User Scenarios

**File:** `tests/copy-job-creation/concurrent-operations.spec.ts`

**Steps:**
  1. Start copy job creation process
  2. Simulate another user creating job with same name
  3. Attempt to submit copy job with conflicting name
  4. Verify appropriate conflict resolution
  5. Test creating multiple jobs in rapid succession
  6. Verify each job creation is handled independently
  7. Test opening multiple copy job creation panels
  8. Verify panel management and state isolation

**Expected Results:**
  - Name conflicts are detected and handled appropriately
  - Multiple simultaneous job creations are managed correctly
  - Each copy job creation maintains independent state
  - Concurrent operations don't interfere with each other

### 4. Copy Job Creation - UI/UX Validation

**Seed:** `test/sql/copyjob.seed.spec.ts`

#### 4.1. Verify Panel Navigation and Controls

**File:** `tests/copy-job-creation/panel-navigation.spec.ts`

**Steps:**
  1. Open copy job creation panel
  2. Verify 'Previous' button is disabled on first screen
  3. Verify 'Next' button state changes based on validation
  4. Navigate forward through all screens
  5. Verify 'Previous' button enables navigation backward
  6. Verify breadcrumb or progress indication
  7. Test 'Cancel' button at each step
  8. Verify cancel confirmation dialog if applicable
  9. Test panel close button (X) functionality
  10. Verify unsaved changes warning if applicable

**Expected Results:**
  - Navigation buttons are enabled/disabled appropriately
  - Forward navigation respects validation requirements
  - Backward navigation preserves user data
  - Progress indication is clear and accurate
  - Cancel functionality works consistently
  - Panel close behavior is user-friendly
  - Unsaved changes are handled appropriately

#### 4.2. Verify Dropdown and Form Controls

**File:** `tests/copy-job-creation/form-controls-validation.spec.ts`

**Steps:**
  1. Test all dropdown controls for proper data-test attributes
  2. Verify dropdown placeholder text is informative
  3. Test dropdown option selection and deselection
  4. Verify dropdown filtering/search if available
  5. Test keyboard navigation in dropdowns (Tab, Enter, Escape)
  6. Verify dropdown accessibility attributes (aria-label, role)
  7. Test radio button selection and mutual exclusivity
  8. Verify radio button labels and descriptions
  9. Test input field focus and blur behavior
  10. Verify form validation timing (on blur vs on submit)

**Expected Results:**
  - All dropdowns have correct data-test attributes for automation
  - Placeholder text provides clear guidance
  - Option selection works reliably
  - Keyboard navigation follows accessibility standards
  - ARIA attributes support screen readers
  - Radio buttons enforce single selection
  - Form validation provides immediate feedback
  - Input fields behave predictably

#### 4.3. Verify Loading States and Feedback

**File:** `tests/copy-job-creation/loading-states.spec.ts`

**Steps:**
  1. Open copy job creation panel
  2. Verify loading indicators while fetching subscriptions
  3. Verify loading states for account dropdown population
  4. Test loading behavior for database and container lists
  5. Verify loading indicator during job submission
  6. Test behavior when API calls take longer than expected
  7. Verify loading state accessibility (announcements)
  8. Test loading state cancellation if supported
  9. Verify error states replace loading states appropriately
  10. Test loading state recovery after temporary failures

**Expected Results:**
  - Loading indicators appear for all asynchronous operations
  - Loading states are visually clear and accessible
  - Long-running operations provide appropriate feedback
  - Loading states can be cancelled when appropriate
  - Error handling gracefully replaces loading states
  - Recovery from temporary failures is smooth
