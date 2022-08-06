
/*
 * ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum IntegrationAuthType {
    apiKey = "apiKey",
    http = "http",
    oauth1 = "oauth1",
    oauth2 = "oauth2",
    openIdConnect = "openIdConnect"
}

export enum IntegrationTriggerSortFields {
    id = "id",
    createdAt = "createdAt",
    integration = "integration",
    key = "key",
    name = "name",
    deprecated = "deprecated",
    category = "category",
    skipAuth = "skipAuth"
}

export enum SortDirection {
    ASC = "ASC",
    DESC = "DESC"
}

export enum SortNulls {
    NULLS_FIRST = "NULLS_FIRST",
    NULLS_LAST = "NULLS_LAST"
}

export enum IntegrationActionSortFields {
    id = "id",
    createdAt = "createdAt",
    integration = "integration",
    key = "key",
    name = "name",
    deprecated = "deprecated",
    category = "category",
    skipAuth = "skipAuth"
}

export enum WorkflowActionSortFields {
    id = "id",
    createdAt = "createdAt",
    owner = "owner",
    workflow = "workflow",
    isRootAction = "isRootAction"
}

export enum WorkflowRunStatus {
    running = "running",
    sleeping = "sleeping",
    completed = "completed",
    failed = "failed"
}

export enum WorkflowRunStartedByOptions {
    user = "user",
    trigger = "trigger",
    workflowFailure = "workflowFailure"
}

export enum AccountCredentialSortFields {
    id = "id",
    createdAt = "createdAt",
    owner = "owner",
    integrationAccount = "integrationAccount"
}

export enum IntegrationSortFields {
    id = "id",
    createdAt = "createdAt",
    key = "key",
    name = "name",
    version = "version",
    deprecated = "deprecated",
    parentKey = "parentKey",
    integrationCategories = "integrationCategories",
    numberOfTriggers = "numberOfTriggers",
    numberOfActions = "numberOfActions"
}

export enum IntegrationAccountSortFields {
    id = "id",
    createdAt = "createdAt",
    key = "key",
    name = "name"
}

export enum WorkflowSortFields {
    id = "id",
    createdAt = "createdAt",
    owner = "owner",
    project = "project",
    name = "name",
    slug = "slug"
}

export enum ProjectSortFields {
    id = "id",
    createdAt = "createdAt",
    owner = "owner",
    name = "name",
    slug = "slug"
}

export enum WorkflowNextActionSortFields {
    action = "action"
}

export enum WorkflowTriggerSortFields {
    id = "id",
    createdAt = "createdAt",
    owner = "owner",
    workflow = "workflow"
}

export enum WorkflowRunSortFields {
    id = "id",
    createdAt = "createdAt",
    workflow = "workflow",
    status = "status",
    startedBy = "startedBy"
}

export enum WorkflowRunTriggerSortFields {
    status = "status"
}

export enum WorkflowRunActionSortFields {
    id = "id",
    createdAt = "createdAt",
    status = "status"
}

export interface CursorPaging {
    before?: ConnectionCursor;
    after?: ConnectionCursor;
    first?: number;
    last?: number;
}

export interface IntegrationTriggerFilter {
    and?: IntegrationTriggerFilter[];
    or?: IntegrationTriggerFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    integration?: IDFilterComparison;
    key?: StringFieldComparison;
    name?: StringFieldComparison;
    deprecated?: BooleanFieldComparison;
    category?: StringFieldComparison;
    skipAuth?: BooleanFieldComparison;
}

export interface IDFilterComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: string;
    neq?: string;
    gt?: string;
    gte?: string;
    lt?: string;
    lte?: string;
    like?: string;
    notLike?: string;
    iLike?: string;
    notILike?: string;
    in?: string[];
    notIn?: string[];
}

export interface DateFieldComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: DateTime;
    neq?: DateTime;
    gt?: DateTime;
    gte?: DateTime;
    lt?: DateTime;
    lte?: DateTime;
    in?: DateTime[];
    notIn?: DateTime[];
    between?: DateFieldComparisonBetween;
    notBetween?: DateFieldComparisonBetween;
}

export interface DateFieldComparisonBetween {
    lower: DateTime;
    upper: DateTime;
}

export interface StringFieldComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: string;
    neq?: string;
    gt?: string;
    gte?: string;
    lt?: string;
    lte?: string;
    like?: string;
    notLike?: string;
    iLike?: string;
    notILike?: string;
    in?: string[];
    notIn?: string[];
}

export interface BooleanFieldComparison {
    is?: boolean;
    isNot?: boolean;
}

export interface IntegrationTriggerSort {
    field: IntegrationTriggerSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface IntegrationActionFilter {
    and?: IntegrationActionFilter[];
    or?: IntegrationActionFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    integration?: IDFilterComparison;
    key?: StringFieldComparison;
    name?: StringFieldComparison;
    deprecated?: BooleanFieldComparison;
    category?: StringFieldComparison;
    skipAuth?: BooleanFieldComparison;
}

export interface IntegrationActionSort {
    field: IntegrationActionSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowActionFilter {
    and?: WorkflowActionFilter[];
    or?: WorkflowActionFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
    isRootAction?: BooleanFieldComparison;
}

export interface WorkflowActionSort {
    field: WorkflowActionSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface AccountCredentialFilter {
    and?: AccountCredentialFilter[];
    or?: AccountCredentialFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    integrationAccount?: IDFilterComparison;
}

export interface AccountCredentialSort {
    field: AccountCredentialSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface IntegrationFilter {
    and?: IntegrationFilter[];
    or?: IntegrationFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    key?: StringFieldComparison;
    name?: StringFieldComparison;
    version?: StringFieldComparison;
    deprecated?: BooleanFieldComparison;
    parentKey?: StringFieldComparison;
    integrationCategories?: StringFieldComparison;
    numberOfTriggers?: IntFieldComparison;
    numberOfActions?: IntFieldComparison;
}

export interface IntFieldComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: number;
    neq?: number;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    in?: number[];
    notIn?: number[];
    between?: IntFieldComparisonBetween;
    notBetween?: IntFieldComparisonBetween;
}

export interface IntFieldComparisonBetween {
    lower: number;
    upper: number;
}

export interface IntegrationSort {
    field: IntegrationSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface IntegrationAccountFilter {
    and?: IntegrationAccountFilter[];
    or?: IntegrationAccountFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    key?: StringFieldComparison;
    name?: StringFieldComparison;
}

export interface IntegrationAccountSort {
    field: IntegrationAccountSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowFilter {
    and?: WorkflowFilter[];
    or?: WorkflowFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    project?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface WorkflowSort {
    field: WorkflowSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface ProjectFilter {
    and?: ProjectFilter[];
    or?: ProjectFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface ProjectSort {
    field: ProjectSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowNextActionFilter {
    and?: WorkflowNextActionFilter[];
    or?: WorkflowNextActionFilter[];
    action?: IDFilterComparison;
}

export interface WorkflowNextActionSort {
    field: WorkflowNextActionSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowTriggerFilter {
    and?: WorkflowTriggerFilter[];
    or?: WorkflowTriggerFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
}

export interface WorkflowTriggerSort {
    field: WorkflowTriggerSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowRunFilter {
    and?: WorkflowRunFilter[];
    or?: WorkflowRunFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    workflow?: IDFilterComparison;
    status?: WorkflowRunStatusFilterComparison;
    startedBy?: WorkflowRunStartedByOptionsFilterComparison;
}

export interface WorkflowRunStatusFilterComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: WorkflowRunStatus;
    neq?: WorkflowRunStatus;
    gt?: WorkflowRunStatus;
    gte?: WorkflowRunStatus;
    lt?: WorkflowRunStatus;
    lte?: WorkflowRunStatus;
    like?: WorkflowRunStatus;
    notLike?: WorkflowRunStatus;
    iLike?: WorkflowRunStatus;
    notILike?: WorkflowRunStatus;
    in?: WorkflowRunStatus[];
    notIn?: WorkflowRunStatus[];
}

export interface WorkflowRunStartedByOptionsFilterComparison {
    is?: boolean;
    isNot?: boolean;
    eq?: WorkflowRunStartedByOptions;
    neq?: WorkflowRunStartedByOptions;
    gt?: WorkflowRunStartedByOptions;
    gte?: WorkflowRunStartedByOptions;
    lt?: WorkflowRunStartedByOptions;
    lte?: WorkflowRunStartedByOptions;
    like?: WorkflowRunStartedByOptions;
    notLike?: WorkflowRunStartedByOptions;
    iLike?: WorkflowRunStartedByOptions;
    notILike?: WorkflowRunStartedByOptions;
    in?: WorkflowRunStartedByOptions[];
    notIn?: WorkflowRunStartedByOptions[];
}

export interface WorkflowRunSort {
    field: WorkflowRunSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowRunTriggerFilter {
    and?: WorkflowRunTriggerFilter[];
    or?: WorkflowRunTriggerFilter[];
    status?: WorkflowRunStatusFilterComparison;
}

export interface WorkflowRunTriggerSort {
    field: WorkflowRunTriggerSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface WorkflowRunActionFilter {
    and?: WorkflowRunActionFilter[];
    or?: WorkflowRunActionFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    status?: WorkflowRunStatusFilterComparison;
}

export interface WorkflowRunActionSort {
    field: WorkflowRunActionSortFields;
    direction: SortDirection;
    nulls?: SortNulls;
}

export interface UpdateOneUserInput {
    id: string;
    update: UpdateUserInput;
}

export interface UpdateUserInput {
    name?: string;
    website?: string;
    company?: string;
    email?: string;
}

export interface CreateOneAccountCredentialInput {
    accountCredential: CreateAccountCredentialInput;
}

export interface CreateAccountCredentialInput {
    integrationAccount: string;
    name: string;
    credentials?: JSONObject;
    fields?: JSONObject;
}

export interface CreateManyAccountCredentialsInput {
    accountCredentials: CreateAccountCredentialInput[];
}

export interface UpdateOneAccountCredentialInput {
    id: string;
    update: UpdateAccountCredentialInput;
}

export interface UpdateAccountCredentialInput {
    name?: string;
    credentials?: JSONObject;
    fields?: JSONObject;
}

export interface UpdateManyAccountCredentialsInput {
    filter: AccountCredentialUpdateFilter;
    update: UpdateAccountCredentialInput;
}

export interface AccountCredentialUpdateFilter {
    and?: AccountCredentialUpdateFilter[];
    or?: AccountCredentialUpdateFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    integrationAccount?: IDFilterComparison;
}

export interface DeleteOneAccountCredentialInput {
    id: string;
}

export interface DeleteManyAccountCredentialsInput {
    filter: AccountCredentialDeleteFilter;
}

export interface AccountCredentialDeleteFilter {
    and?: AccountCredentialDeleteFilter[];
    or?: AccountCredentialDeleteFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    integrationAccount?: IDFilterComparison;
}

export interface CreateOneWorkflowInput {
    workflow: CreateWorkflowInput;
}

export interface CreateWorkflowInput {
    name: string;
    project: string;
    runOnFailure?: string;
}

export interface CreateManyWorkflowsInput {
    workflows: CreateWorkflowInput[];
}

export interface UpdateOneWorkflowInput {
    id: string;
    update: UpdateWorkflowInput;
}

export interface UpdateWorkflowInput {
    name?: string;
    runOnFailure?: string;
}

export interface UpdateManyWorkflowsInput {
    filter: WorkflowUpdateFilter;
    update: UpdateWorkflowInput;
}

export interface WorkflowUpdateFilter {
    and?: WorkflowUpdateFilter[];
    or?: WorkflowUpdateFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    project?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface DeleteOneWorkflowInput {
    id: string;
}

export interface DeleteManyWorkflowsInput {
    filter: WorkflowDeleteFilter;
}

export interface WorkflowDeleteFilter {
    and?: WorkflowDeleteFilter[];
    or?: WorkflowDeleteFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    project?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface CreateOneProjectInput {
    project: CreateProjectInput;
}

export interface CreateProjectInput {
    name: string;
    public?: boolean;
}

export interface CreateManyProjectsInput {
    projects: CreateProjectInput[];
}

export interface UpdateOneProjectInput {
    id: string;
    update: UpdateProjectInput;
}

export interface UpdateProjectInput {
    name?: string;
    public?: boolean;
}

export interface UpdateManyProjectsInput {
    filter: ProjectUpdateFilter;
    update: UpdateProjectInput;
}

export interface ProjectUpdateFilter {
    and?: ProjectUpdateFilter[];
    or?: ProjectUpdateFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface DeleteOneProjectInput {
    id: string;
}

export interface DeleteManyProjectsInput {
    filter: ProjectDeleteFilter;
}

export interface ProjectDeleteFilter {
    and?: ProjectDeleteFilter[];
    or?: ProjectDeleteFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    name?: StringFieldComparison;
    slug?: StringFieldComparison;
}

export interface CreateOneWorkflowActionInput {
    workflowAction: CreateWorkflowActionInput;
}

export interface CreateWorkflowActionInput {
    workflow: string;
    integrationAction: string;
    inputs: JSONObject;
    previousAction?: string;
    previousActionCondition?: string;
    nextAction?: string;
    credentials?: string;
}

export interface CreateManyWorkflowActionsInput {
    workflowActions: CreateWorkflowActionInput[];
}

export interface UpdateOneWorkflowActionInput {
    id: string;
    update: UpdateWorkflowActionInput;
}

export interface UpdateWorkflowActionInput {
    name: string;
    inputs?: JSONObject;
    credentials?: string;
}

export interface UpdateManyWorkflowActionsInput {
    filter: WorkflowActionUpdateFilter;
    update: UpdateWorkflowActionInput;
}

export interface WorkflowActionUpdateFilter {
    and?: WorkflowActionUpdateFilter[];
    or?: WorkflowActionUpdateFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
    isRootAction?: BooleanFieldComparison;
}

export interface DeleteOneWorkflowActionInput {
    id: string;
}

export interface DeleteManyWorkflowActionsInput {
    filter: WorkflowActionDeleteFilter;
}

export interface WorkflowActionDeleteFilter {
    and?: WorkflowActionDeleteFilter[];
    or?: WorkflowActionDeleteFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
    isRootAction?: BooleanFieldComparison;
}

export interface CreateOneWorkflowTriggerInput {
    workflowTrigger: CreateWorkflowTriggerInput;
}

export interface CreateWorkflowTriggerInput {
    workflow: string;
    integrationTrigger: string;
    inputs: JSONObject;
    credentials?: string;
    schedule?: JSONObject;
    enabled?: boolean;
    maxConsecutiveFailures?: number;
}

export interface CreateManyWorkflowTriggersInput {
    workflowTriggers: CreateWorkflowTriggerInput[];
}

export interface UpdateOneWorkflowTriggerInput {
    id: string;
    update: UpdateWorkflowTriggerInput;
}

export interface UpdateWorkflowTriggerInput {
    name?: string;
    inputs?: JSONObject;
    credentials?: string;
    schedule?: JSONObject;
    enabled?: boolean;
    maxConsecutiveFailures?: number;
}

export interface UpdateManyWorkflowTriggersInput {
    filter: WorkflowTriggerUpdateFilter;
    update: UpdateWorkflowTriggerInput;
}

export interface WorkflowTriggerUpdateFilter {
    and?: WorkflowTriggerUpdateFilter[];
    or?: WorkflowTriggerUpdateFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
}

export interface DeleteOneWorkflowTriggerInput {
    id: string;
}

export interface DeleteManyWorkflowTriggersInput {
    filter: WorkflowTriggerDeleteFilter;
}

export interface WorkflowTriggerDeleteFilter {
    and?: WorkflowTriggerDeleteFilter[];
    or?: WorkflowTriggerDeleteFilter[];
    id?: IDFilterComparison;
    createdAt?: DateFieldComparison;
    owner?: IDFilterComparison;
    workflow?: IDFilterComparison;
}

export interface IntegrationAccount {
    id: string;
    createdAt: DateTime;
    key: string;
    name: string;
    description?: string;
    authType: IntegrationAuthType;
    fieldsSchema?: JSONObject;
}

export interface DeleteManyResponse {
    deletedCount: number;
}

export interface UpdateManyResponse {
    updatedCount: number;
}

export interface IntegrationAccountEdge {
    node: IntegrationAccount;
    cursor: ConnectionCursor;
}

export interface PageInfo {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    startCursor?: ConnectionCursor;
    endCursor?: ConnectionCursor;
}

export interface IntegrationAccountConnection {
    pageInfo: PageInfo;
    edges: IntegrationAccountEdge[];
}

export interface IntegrationTrigger {
    id: string;
    createdAt: DateTime;
    integration: Integration;
    key: string;
    name: string;
    description?: string;
    deprecated: boolean;
    category?: string;
    skipAuth: boolean;
    schemaRequest: JSONObject;
    schemaResponse?: JSONObject;
    instant: boolean;
    isWebhook: boolean;
    hookInstructions?: string;
    integrationAction: IntegrationAction;
}

export interface OperationCategory {
    key: string;
    name: string;
    description?: string;
    numberOfActions: number;
    numberOfTriggers: number;
}

export interface Integration {
    id: string;
    createdAt: DateTime;
    key: string;
    name: string;
    logo?: string;
    version: string;
    deprecated: boolean;
    parentKey?: string;
    integrationAccount?: IntegrationAccount;
    integrationCategories: string;
    operationCategories?: OperationCategory[];
    numberOfTriggers: number;
    numberOfActions: number;
    triggers: IntegrationTriggersConnection;
    actions: IntegrationActionsConnection;
}

export interface IntegrationAction {
    id: string;
    createdAt: DateTime;
    integration: Integration;
    key: string;
    name: string;
    description?: string;
    deprecated: boolean;
    category?: string;
    skipAuth: boolean;
    schemaRequest: JSONObject;
    schemaResponse?: JSONObject;
}

export interface IntegrationActionEdge {
    node: IntegrationAction;
    cursor: ConnectionCursor;
}

export interface IntegrationActionConnection {
    pageInfo: PageInfo;
    edges: IntegrationActionEdge[];
}

export interface IntegrationTriggerEdge {
    node: IntegrationTrigger;
    cursor: ConnectionCursor;
}

export interface IntegrationTriggerConnection {
    pageInfo: PageInfo;
    edges: IntegrationTriggerEdge[];
}

export interface IntegrationCategory {
    id: string;
    key: string;
    name: string;
}

export interface IntegrationEdge {
    node: Integration;
    cursor: ConnectionCursor;
}

export interface IntegrationConnection {
    pageInfo: PageInfo;
    edges: IntegrationEdge[];
}

export interface IntegrationActionsConnection {
    pageInfo: PageInfo;
    edges: IntegrationActionEdge[];
}

export interface IntegrationTriggersConnection {
    pageInfo: PageInfo;
    edges: IntegrationTriggerEdge[];
}

export interface User {
    id: string;
    createdAt: DateTime;
    username: string;
    email: string;
    operationsUsedMonth: number;
    name?: string;
    website?: string;
    company?: string;
    apiKey?: string;
}

export interface GenerateApiTokenPayload {
    apiKey: string;
}

export interface UserEdge {
    node: User;
    cursor: ConnectionCursor;
}

export interface Project {
    id: string;
    createdAt: DateTime;
    owner: User;
    name: string;
    public: boolean;
    slug: string;
}

export interface AccountCredential {
    id: string;
    createdAt: DateTime;
    owner: User;
    integrationAccount: IntegrationAccount;
    name: string;
    fields?: JSONObject;
    schemaRefs?: JSONObject;
}

export interface WorkflowNextAction {
    action: WorkflowAction;
    condition?: string;
}

export interface WorkflowAction {
    id: string;
    createdAt: DateTime;
    owner: User;
    workflow: Workflow;
    isRootAction: boolean;
    integrationAction: IntegrationAction;
    name: string;
    inputs?: JSONObject;
    nextActions?: WorkflowNextAction[];
    credentials?: AccountCredential;
    schemaResponse?: JSONObject;
}

export interface WorkflowTrigger {
    id: string;
    createdAt: DateTime;
    owner: User;
    workflow: Workflow;
    integrationTrigger: IntegrationTrigger;
    name: string;
    inputs?: JSONObject;
    credentials?: AccountCredential;
    schedule?: JSONObject;
    enabled: boolean;
    maxConsecutiveFailures: number;
    hookId?: string;
    schemaResponse?: JSONObject;
}

export interface Workflow {
    id: string;
    createdAt: DateTime;
    owner: User;
    project: Project;
    name: string;
    slug: string;
    state?: string;
    runOnFailure?: string;
    trigger?: WorkflowTrigger;
    actions?: WorkflowActionsConnection;
}

export interface WorkflowDeleteResponse {
    id?: string;
    createdAt?: DateTime;
    owner?: string;
    project?: string;
    name?: string;
    slug?: string;
    state?: string;
    runOnFailure?: string;
}

export interface WorkflowEdge {
    node: Workflow;
    cursor: ConnectionCursor;
}

export interface WorkflowConnection {
    pageInfo: PageInfo;
    edges: WorkflowEdge[];
}

export interface WorkflowActionEdge {
    node: WorkflowAction;
    cursor: ConnectionCursor;
}

export interface WorkflowActionsConnection {
    pageInfo: PageInfo;
    edges: WorkflowActionEdge[];
}

export interface ProjectDeleteResponse {
    id?: string;
    createdAt?: DateTime;
    owner?: string;
    name?: string;
    public?: boolean;
    slug?: string;
}

export interface ProjectEdge {
    node: Project;
    cursor: ConnectionCursor;
}

export interface ProjectConnection {
    pageInfo: PageInfo;
    edges: ProjectEdge[];
}

export interface AuthToken {
    accessToken: string;
    accessTokenExpiration: DateTime;
    refreshToken: string;
}

export interface LoginPayload {
    user: User;
    token: AuthToken;
}

export interface RegisterPayload {
    user: User;
    token: AuthToken;
    project: Project;
}

export interface VerifyEmailPayload {
    error?: string;
}

export interface ResetPasswordPayload {
    result: boolean;
}

export interface CompletePasswordPayload {
    error?: string;
}

export interface CompleteExternalAuthPayload {
    user: User;
    token: AuthToken;
    project?: Project;
}

export interface WorkflowRunAction {
    id: string;
    createdAt: DateTime;
    workflowAction: WorkflowAction;
    integrationName: string;
    operationName: string;
    status: WorkflowRunStatus;
    finishedAt?: DateTime;
}

export interface WorkflowRunTrigger {
    workflowTrigger: WorkflowTrigger;
    integrationName: string;
    operationName: string;
    status: WorkflowRunStatus;
    workflowTriggered?: boolean;
    triggerIds?: string[];
    finishedAt?: DateTime;
}

export interface WorkflowRun {
    id: string;
    createdAt: DateTime;
    workflow: Workflow;
    status: WorkflowRunStatus;
    triggerRun?: WorkflowRunTrigger;
    actionRuns: WorkflowRunAction[];
    startedBy: WorkflowRunStartedByOptions;
    operationsUsed: number;
    errorMessage?: string;
    errorResponse?: string;
}

export interface WorkflowRunEdge {
    node: WorkflowRun;
    cursor: ConnectionCursor;
}

export interface WorkflowRunConnection {
    pageInfo: PageInfo;
    edges: WorkflowRunEdge[];
}

export interface WorkflowRunTriggerEdge {
    node: WorkflowRunTrigger;
    cursor: ConnectionCursor;
}

export interface WorkflowRunTriggerConnection {
    pageInfo: PageInfo;
    edges: WorkflowRunTriggerEdge[];
}

export interface WorkflowRunActionEdge {
    node: WorkflowRunAction;
    cursor: ConnectionCursor;
}

export interface WorkflowRunActionConnection {
    pageInfo: PageInfo;
    edges: WorkflowRunActionEdge[];
}

export interface WorkflowTriggerDeleteResponse {
    id?: string;
    createdAt?: DateTime;
    owner?: string;
    workflow?: string;
    integrationTrigger?: string;
    name?: string;
    inputs?: JSONObject;
    credentials?: AccountCredential;
    schedule?: JSONObject;
    enabled?: boolean;
    maxConsecutiveFailures?: number;
    hookId?: string;
    schemaResponse?: JSONObject;
}

export interface WorkflowTriggerEdge {
    node: WorkflowTrigger;
    cursor: ConnectionCursor;
}

export interface WorkflowTriggerConnection {
    pageInfo: PageInfo;
    edges: WorkflowTriggerEdge[];
}

export interface WorkflowActionDeleteResponse {
    id?: string;
    createdAt?: DateTime;
    owner?: string;
    workflow?: string;
    isRootAction?: boolean;
    integrationAction?: string;
    name?: string;
    inputs?: JSONObject;
    nextActions?: WorkflowNextAction[];
    credentials?: string;
    schemaResponse?: JSONObject;
}

export interface WorkflowActionConnection {
    pageInfo: PageInfo;
    edges: WorkflowActionEdge[];
}

export interface WorkflowNextActionEdge {
    node: WorkflowNextAction;
    cursor: ConnectionCursor;
}

export interface WorkflowNextActionConnection {
    pageInfo: PageInfo;
    edges: WorkflowNextActionEdge[];
}

export interface AccountCredentialDeleteResponse {
    id?: string;
    createdAt?: DateTime;
    owner?: string;
    integrationAccount?: string;
    name?: string;
    fields?: JSONObject;
    schemaRefs?: JSONObject;
}

export interface AccountCredentialEdge {
    node: AccountCredential;
    cursor: ConnectionCursor;
}

export interface AccountCredentialConnection {
    pageInfo: PageInfo;
    edges: AccountCredentialEdge[];
}

export interface ContractSchema {
    id: string;
    chainId: number;
    address: string;
    schema: JSONObject;
}

export interface AsyncSchema {
    schemas: JSONObject;
}

export interface IQuery {
    user(id: string): User | Promise<User>;
    viewer(): User | Promise<User>;
    accountCredential(id: string): AccountCredential | Promise<AccountCredential>;
    accountCredentials(paging?: CursorPaging, filter?: AccountCredentialFilter, sorting?: AccountCredentialSort[]): AccountCredentialConnection | Promise<AccountCredentialConnection>;
    integration(id: string): Integration | Promise<Integration>;
    integrations(search?: string, paging?: CursorPaging, filter?: IntegrationFilter, sorting?: IntegrationSort[]): IntegrationConnection | Promise<IntegrationConnection>;
    integrationCategories(): IntegrationCategory[] | Promise<IntegrationCategory[]>;
    integrationCategory(id: string): IntegrationCategory | Promise<IntegrationCategory>;
    integrationAccount(id: string): IntegrationAccount | Promise<IntegrationAccount>;
    integrationAccounts(paging?: CursorPaging, filter?: IntegrationAccountFilter, sorting?: IntegrationAccountSort[]): IntegrationAccountConnection | Promise<IntegrationAccountConnection>;
    integrationAction(id: string): IntegrationAction | Promise<IntegrationAction>;
    integrationActions(search?: string, paging?: CursorPaging, filter?: IntegrationActionFilter, sorting?: IntegrationActionSort[]): IntegrationActionConnection | Promise<IntegrationActionConnection>;
    integrationTrigger(id: string): IntegrationTrigger | Promise<IntegrationTrigger>;
    integrationTriggers(search?: string, paging?: CursorPaging, filter?: IntegrationTriggerFilter, sorting?: IntegrationTriggerSort[]): IntegrationTriggerConnection | Promise<IntegrationTriggerConnection>;
    workflow(id: string): Workflow | Promise<Workflow>;
    workflows(paging?: CursorPaging, filter?: WorkflowFilter, sorting?: WorkflowSort[]): WorkflowConnection | Promise<WorkflowConnection>;
    project(id: string): Project | Promise<Project>;
    projects(paging?: CursorPaging, filter?: ProjectFilter, sorting?: ProjectSort[]): ProjectConnection | Promise<ProjectConnection>;
    workflowAction(id: string): WorkflowAction | Promise<WorkflowAction>;
    workflowActions(paging?: CursorPaging, filter?: WorkflowActionFilter, sorting?: WorkflowActionSort[]): WorkflowActionConnection | Promise<WorkflowActionConnection>;
    workflowNextAction(id: string): WorkflowNextAction | Promise<WorkflowNextAction>;
    workflowNextActions(paging?: CursorPaging, filter?: WorkflowNextActionFilter, sorting?: WorkflowNextActionSort[]): WorkflowNextActionConnection | Promise<WorkflowNextActionConnection>;
    workflowTrigger(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    workflowTriggers(paging?: CursorPaging, filter?: WorkflowTriggerFilter, sorting?: WorkflowTriggerSort[]): WorkflowTriggerConnection | Promise<WorkflowTriggerConnection>;
    workflowRun(id: string): WorkflowRun | Promise<WorkflowRun>;
    workflowRuns(paging?: CursorPaging, filter?: WorkflowRunFilter, sorting?: WorkflowRunSort[]): WorkflowRunConnection | Promise<WorkflowRunConnection>;
    workflowRunTrigger(id: string): WorkflowRunTrigger | Promise<WorkflowRunTrigger>;
    workflowRunTriggers(paging?: CursorPaging, filter?: WorkflowRunTriggerFilter, sorting?: WorkflowRunTriggerSort[]): WorkflowRunTriggerConnection | Promise<WorkflowRunTriggerConnection>;
    workflowRunAction(id: string): WorkflowRunAction | Promise<WorkflowRunAction>;
    workflowRunActions(paging?: CursorPaging, filter?: WorkflowRunActionFilter, sorting?: WorkflowRunActionSort[]): WorkflowRunActionConnection | Promise<WorkflowRunActionConnection>;
    contractSchema(type: string, address: string, chainId: number): ContractSchema | Promise<ContractSchema>;
    asyncSchemas(names: string[], accountCredentialId: string, integrationId: string): AsyncSchema | Promise<AsyncSchema>;
}

export interface IMutation {
    login(password: string, username: string): LoginPayload | Promise<LoginPayload>;
    register(password: string, username: string, email: string): RegisterPayload | Promise<RegisterPayload>;
    logout(): boolean | Promise<boolean>;
    getAccessToken(): string | Promise<string>;
    verifyEmail(code: string, username: string): VerifyEmailPayload | Promise<VerifyEmailPayload>;
    requestPasswordReset(email: string): ResetPasswordPayload | Promise<ResetPasswordPayload>;
    completePasswordReset(password: string, code: string, username: string): CompletePasswordPayload | Promise<CompletePasswordPayload>;
    completeExternalAuth(email: string, username: string, code: string, id: string): CompleteExternalAuthPayload | Promise<CompleteExternalAuthPayload>;
    updateOneUser(input: UpdateOneUserInput): User | Promise<User>;
    changePassword(newPassword: string, oldPassword: string): User | Promise<User>;
    generateApiKey(): GenerateApiTokenPayload | Promise<GenerateApiTokenPayload>;
    createOneAccountCredential(input: CreateOneAccountCredentialInput): AccountCredential | Promise<AccountCredential>;
    createManyAccountCredentials(input: CreateManyAccountCredentialsInput): AccountCredential[] | Promise<AccountCredential[]>;
    updateOneAccountCredential(input: UpdateOneAccountCredentialInput): AccountCredential | Promise<AccountCredential>;
    updateManyAccountCredentials(input: UpdateManyAccountCredentialsInput): UpdateManyResponse | Promise<UpdateManyResponse>;
    deleteOneAccountCredential(input: DeleteOneAccountCredentialInput): AccountCredentialDeleteResponse | Promise<AccountCredentialDeleteResponse>;
    deleteManyAccountCredentials(input: DeleteManyAccountCredentialsInput): DeleteManyResponse | Promise<DeleteManyResponse>;
    createOneWorkflow(input: CreateOneWorkflowInput): Workflow | Promise<Workflow>;
    createManyWorkflows(input: CreateManyWorkflowsInput): Workflow[] | Promise<Workflow[]>;
    updateOneWorkflow(input: UpdateOneWorkflowInput): Workflow | Promise<Workflow>;
    updateManyWorkflows(input: UpdateManyWorkflowsInput): UpdateManyResponse | Promise<UpdateManyResponse>;
    deleteOneWorkflow(input: DeleteOneWorkflowInput): WorkflowDeleteResponse | Promise<WorkflowDeleteResponse>;
    deleteManyWorkflows(input: DeleteManyWorkflowsInput): DeleteManyResponse | Promise<DeleteManyResponse>;
    createOneProject(input: CreateOneProjectInput): Project | Promise<Project>;
    createManyProjects(input: CreateManyProjectsInput): Project[] | Promise<Project[]>;
    updateOneProject(input: UpdateOneProjectInput): Project | Promise<Project>;
    updateManyProjects(input: UpdateManyProjectsInput): UpdateManyResponse | Promise<UpdateManyResponse>;
    deleteOneProject(input: DeleteOneProjectInput): ProjectDeleteResponse | Promise<ProjectDeleteResponse>;
    deleteManyProjects(input: DeleteManyProjectsInput): DeleteManyResponse | Promise<DeleteManyResponse>;
    createOneWorkflowAction(input: CreateOneWorkflowActionInput): WorkflowAction | Promise<WorkflowAction>;
    createManyWorkflowActions(input: CreateManyWorkflowActionsInput): WorkflowAction[] | Promise<WorkflowAction[]>;
    updateOneWorkflowAction(input: UpdateOneWorkflowActionInput): WorkflowAction | Promise<WorkflowAction>;
    updateManyWorkflowActions(input: UpdateManyWorkflowActionsInput): UpdateManyResponse | Promise<UpdateManyResponse>;
    deleteOneWorkflowAction(input: DeleteOneWorkflowActionInput): WorkflowActionDeleteResponse | Promise<WorkflowActionDeleteResponse>;
    deleteManyWorkflowActions(input: DeleteManyWorkflowActionsInput): DeleteManyResponse | Promise<DeleteManyResponse>;
    createOneWorkflowTrigger(input: CreateOneWorkflowTriggerInput): WorkflowTrigger | Promise<WorkflowTrigger>;
    createManyWorkflowTriggers(input: CreateManyWorkflowTriggersInput): WorkflowTrigger[] | Promise<WorkflowTrigger[]>;
    updateOneWorkflowTrigger(input: UpdateOneWorkflowTriggerInput): WorkflowTrigger | Promise<WorkflowTrigger>;
    updateManyWorkflowTriggers(input: UpdateManyWorkflowTriggersInput): UpdateManyResponse | Promise<UpdateManyResponse>;
    deleteOneWorkflowTrigger(input: DeleteOneWorkflowTriggerInput): WorkflowTriggerDeleteResponse | Promise<WorkflowTriggerDeleteResponse>;
    deleteManyWorkflowTriggers(input: DeleteManyWorkflowTriggersInput): DeleteManyResponse | Promise<DeleteManyResponse>;
    checkWorkflowTrigger(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
}

export type DateTime = any;
export type JSONObject = any;
export type ConnectionCursor = any;
