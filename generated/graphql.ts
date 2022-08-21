
/*
 * -------------------------------------------------------
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
    before?: Nullable<ConnectionCursor>;
    after?: Nullable<ConnectionCursor>;
    first?: Nullable<number>;
    last?: Nullable<number>;
}

export interface IntegrationTriggerFilter {
    and?: Nullable<IntegrationTriggerFilter[]>;
    or?: Nullable<IntegrationTriggerFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    integration?: Nullable<IDFilterComparison>;
    key?: Nullable<StringFieldComparison>;
    name?: Nullable<StringFieldComparison>;
    deprecated?: Nullable<BooleanFieldComparison>;
    category?: Nullable<StringFieldComparison>;
    skipAuth?: Nullable<BooleanFieldComparison>;
}

export interface IDFilterComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<string>;
    neq?: Nullable<string>;
    gt?: Nullable<string>;
    gte?: Nullable<string>;
    lt?: Nullable<string>;
    lte?: Nullable<string>;
    like?: Nullable<string>;
    notLike?: Nullable<string>;
    iLike?: Nullable<string>;
    notILike?: Nullable<string>;
    in?: Nullable<string[]>;
    notIn?: Nullable<string[]>;
}

export interface DateFieldComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<DateTime>;
    neq?: Nullable<DateTime>;
    gt?: Nullable<DateTime>;
    gte?: Nullable<DateTime>;
    lt?: Nullable<DateTime>;
    lte?: Nullable<DateTime>;
    in?: Nullable<DateTime[]>;
    notIn?: Nullable<DateTime[]>;
    between?: Nullable<DateFieldComparisonBetween>;
    notBetween?: Nullable<DateFieldComparisonBetween>;
}

export interface DateFieldComparisonBetween {
    lower: DateTime;
    upper: DateTime;
}

export interface StringFieldComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<string>;
    neq?: Nullable<string>;
    gt?: Nullable<string>;
    gte?: Nullable<string>;
    lt?: Nullable<string>;
    lte?: Nullable<string>;
    like?: Nullable<string>;
    notLike?: Nullable<string>;
    iLike?: Nullable<string>;
    notILike?: Nullable<string>;
    in?: Nullable<string[]>;
    notIn?: Nullable<string[]>;
}

export interface BooleanFieldComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
}

export interface IntegrationTriggerSort {
    field: IntegrationTriggerSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface IntegrationActionFilter {
    and?: Nullable<IntegrationActionFilter[]>;
    or?: Nullable<IntegrationActionFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    integration?: Nullable<IDFilterComparison>;
    key?: Nullable<StringFieldComparison>;
    name?: Nullable<StringFieldComparison>;
    deprecated?: Nullable<BooleanFieldComparison>;
    category?: Nullable<StringFieldComparison>;
    skipAuth?: Nullable<BooleanFieldComparison>;
}

export interface IntegrationActionSort {
    field: IntegrationActionSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowActionFilter {
    and?: Nullable<WorkflowActionFilter[]>;
    or?: Nullable<WorkflowActionFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
    isRootAction?: Nullable<BooleanFieldComparison>;
}

export interface WorkflowActionSort {
    field: WorkflowActionSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface AccountCredentialFilter {
    and?: Nullable<AccountCredentialFilter[]>;
    or?: Nullable<AccountCredentialFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    integrationAccount?: Nullable<IDFilterComparison>;
}

export interface AccountCredentialSort {
    field: AccountCredentialSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface IntegrationFilter {
    and?: Nullable<IntegrationFilter[]>;
    or?: Nullable<IntegrationFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    key?: Nullable<StringFieldComparison>;
    name?: Nullable<StringFieldComparison>;
    version?: Nullable<StringFieldComparison>;
    deprecated?: Nullable<BooleanFieldComparison>;
    parentKey?: Nullable<StringFieldComparison>;
    integrationCategories?: Nullable<StringFieldComparison>;
    numberOfTriggers?: Nullable<IntFieldComparison>;
    numberOfActions?: Nullable<IntFieldComparison>;
}

export interface IntFieldComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<number>;
    neq?: Nullable<number>;
    gt?: Nullable<number>;
    gte?: Nullable<number>;
    lt?: Nullable<number>;
    lte?: Nullable<number>;
    in?: Nullable<number[]>;
    notIn?: Nullable<number[]>;
    between?: Nullable<IntFieldComparisonBetween>;
    notBetween?: Nullable<IntFieldComparisonBetween>;
}

export interface IntFieldComparisonBetween {
    lower: number;
    upper: number;
}

export interface IntegrationSort {
    field: IntegrationSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface IntegrationAccountFilter {
    and?: Nullable<IntegrationAccountFilter[]>;
    or?: Nullable<IntegrationAccountFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    key?: Nullable<StringFieldComparison>;
    name?: Nullable<StringFieldComparison>;
}

export interface IntegrationAccountSort {
    field: IntegrationAccountSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowFilter {
    and?: Nullable<WorkflowFilter[]>;
    or?: Nullable<WorkflowFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    project?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface WorkflowSort {
    field: WorkflowSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface ProjectFilter {
    and?: Nullable<ProjectFilter[]>;
    or?: Nullable<ProjectFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface ProjectSort {
    field: ProjectSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowNextActionFilter {
    and?: Nullable<WorkflowNextActionFilter[]>;
    or?: Nullable<WorkflowNextActionFilter[]>;
    action?: Nullable<IDFilterComparison>;
}

export interface WorkflowNextActionSort {
    field: WorkflowNextActionSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowTriggerFilter {
    and?: Nullable<WorkflowTriggerFilter[]>;
    or?: Nullable<WorkflowTriggerFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
}

export interface WorkflowTriggerSort {
    field: WorkflowTriggerSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowRunFilter {
    and?: Nullable<WorkflowRunFilter[]>;
    or?: Nullable<WorkflowRunFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    workflow?: Nullable<IDFilterComparison>;
    status?: Nullable<WorkflowRunStatusFilterComparison>;
    startedBy?: Nullable<WorkflowRunStartedByOptionsFilterComparison>;
}

export interface WorkflowRunStatusFilterComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<WorkflowRunStatus>;
    neq?: Nullable<WorkflowRunStatus>;
    gt?: Nullable<WorkflowRunStatus>;
    gte?: Nullable<WorkflowRunStatus>;
    lt?: Nullable<WorkflowRunStatus>;
    lte?: Nullable<WorkflowRunStatus>;
    like?: Nullable<WorkflowRunStatus>;
    notLike?: Nullable<WorkflowRunStatus>;
    iLike?: Nullable<WorkflowRunStatus>;
    notILike?: Nullable<WorkflowRunStatus>;
    in?: Nullable<WorkflowRunStatus[]>;
    notIn?: Nullable<WorkflowRunStatus[]>;
}

export interface WorkflowRunStartedByOptionsFilterComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<WorkflowRunStartedByOptions>;
    neq?: Nullable<WorkflowRunStartedByOptions>;
    gt?: Nullable<WorkflowRunStartedByOptions>;
    gte?: Nullable<WorkflowRunStartedByOptions>;
    lt?: Nullable<WorkflowRunStartedByOptions>;
    lte?: Nullable<WorkflowRunStartedByOptions>;
    like?: Nullable<WorkflowRunStartedByOptions>;
    notLike?: Nullable<WorkflowRunStartedByOptions>;
    iLike?: Nullable<WorkflowRunStartedByOptions>;
    notILike?: Nullable<WorkflowRunStartedByOptions>;
    in?: Nullable<WorkflowRunStartedByOptions[]>;
    notIn?: Nullable<WorkflowRunStartedByOptions[]>;
}

export interface WorkflowRunSort {
    field: WorkflowRunSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowRunTriggerFilter {
    and?: Nullable<WorkflowRunTriggerFilter[]>;
    or?: Nullable<WorkflowRunTriggerFilter[]>;
    status?: Nullable<WorkflowRunStatusFilterComparison>;
}

export interface WorkflowRunTriggerSort {
    field: WorkflowRunTriggerSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface WorkflowRunActionFilter {
    and?: Nullable<WorkflowRunActionFilter[]>;
    or?: Nullable<WorkflowRunActionFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    status?: Nullable<WorkflowRunStatusFilterComparison>;
}

export interface WorkflowRunActionSort {
    field: WorkflowRunActionSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface UpdateOneUserInput {
    id: string;
    update: UpdateUserInput;
}

export interface UpdateUserInput {
    name?: Nullable<string>;
    website?: Nullable<string>;
    company?: Nullable<string>;
    email?: Nullable<string>;
}

export interface CreateOneAccountCredentialInput {
    accountCredential: CreateAccountCredentialInput;
}

export interface CreateAccountCredentialInput {
    integrationAccount: string;
    name: string;
    credentials?: Nullable<JSONObject>;
    fields?: Nullable<JSONObject>;
}

export interface CreateManyAccountCredentialsInput {
    accountCredentials: CreateAccountCredentialInput[];
}

export interface UpdateOneAccountCredentialInput {
    id: string;
    update: UpdateAccountCredentialInput;
}

export interface UpdateAccountCredentialInput {
    name?: Nullable<string>;
    credentials?: Nullable<JSONObject>;
    fields?: Nullable<JSONObject>;
}

export interface UpdateManyAccountCredentialsInput {
    filter: AccountCredentialUpdateFilter;
    update: UpdateAccountCredentialInput;
}

export interface AccountCredentialUpdateFilter {
    and?: Nullable<AccountCredentialUpdateFilter[]>;
    or?: Nullable<AccountCredentialUpdateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    integrationAccount?: Nullable<IDFilterComparison>;
}

export interface DeleteOneAccountCredentialInput {
    id: string;
}

export interface DeleteManyAccountCredentialsInput {
    filter: AccountCredentialDeleteFilter;
}

export interface AccountCredentialDeleteFilter {
    and?: Nullable<AccountCredentialDeleteFilter[]>;
    or?: Nullable<AccountCredentialDeleteFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    integrationAccount?: Nullable<IDFilterComparison>;
}

export interface CreateOneWorkflowInput {
    workflow: CreateWorkflowInput;
}

export interface CreateWorkflowInput {
    name: string;
    project: string;
    runOnFailure?: Nullable<string>;
}

export interface CreateManyWorkflowsInput {
    workflows: CreateWorkflowInput[];
}

export interface UpdateOneWorkflowInput {
    id: string;
    update: UpdateWorkflowInput;
}

export interface UpdateWorkflowInput {
    name?: Nullable<string>;
    runOnFailure?: Nullable<string>;
}

export interface UpdateManyWorkflowsInput {
    filter: WorkflowUpdateFilter;
    update: UpdateWorkflowInput;
}

export interface WorkflowUpdateFilter {
    and?: Nullable<WorkflowUpdateFilter[]>;
    or?: Nullable<WorkflowUpdateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    project?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface DeleteOneWorkflowInput {
    id: string;
}

export interface DeleteManyWorkflowsInput {
    filter: WorkflowDeleteFilter;
}

export interface WorkflowDeleteFilter {
    and?: Nullable<WorkflowDeleteFilter[]>;
    or?: Nullable<WorkflowDeleteFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    project?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface CreateOneProjectInput {
    project: CreateProjectInput;
}

export interface CreateProjectInput {
    name: string;
    public?: Nullable<boolean>;
}

export interface CreateManyProjectsInput {
    projects: CreateProjectInput[];
}

export interface UpdateOneProjectInput {
    id: string;
    update: UpdateProjectInput;
}

export interface UpdateProjectInput {
    name?: Nullable<string>;
    public?: Nullable<boolean>;
}

export interface UpdateManyProjectsInput {
    filter: ProjectUpdateFilter;
    update: UpdateProjectInput;
}

export interface ProjectUpdateFilter {
    and?: Nullable<ProjectUpdateFilter[]>;
    or?: Nullable<ProjectUpdateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface DeleteOneProjectInput {
    id: string;
}

export interface DeleteManyProjectsInput {
    filter: ProjectDeleteFilter;
}

export interface ProjectDeleteFilter {
    and?: Nullable<ProjectDeleteFilter[]>;
    or?: Nullable<ProjectDeleteFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    name?: Nullable<StringFieldComparison>;
    slug?: Nullable<StringFieldComparison>;
}

export interface CreateOneWorkflowActionInput {
    workflowAction: CreateWorkflowActionInput;
}

export interface CreateWorkflowActionInput {
    workflow: string;
    integrationAction: string;
    inputs: JSONObject;
    previousAction?: Nullable<string>;
    previousActionCondition?: Nullable<string>;
    nextAction?: Nullable<string>;
    credentials?: Nullable<string>;
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
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<string>;
}

export interface UpdateManyWorkflowActionsInput {
    filter: WorkflowActionUpdateFilter;
    update: UpdateWorkflowActionInput;
}

export interface WorkflowActionUpdateFilter {
    and?: Nullable<WorkflowActionUpdateFilter[]>;
    or?: Nullable<WorkflowActionUpdateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
    isRootAction?: Nullable<BooleanFieldComparison>;
}

export interface DeleteOneWorkflowActionInput {
    id: string;
}

export interface DeleteManyWorkflowActionsInput {
    filter: WorkflowActionDeleteFilter;
}

export interface WorkflowActionDeleteFilter {
    and?: Nullable<WorkflowActionDeleteFilter[]>;
    or?: Nullable<WorkflowActionDeleteFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
    isRootAction?: Nullable<BooleanFieldComparison>;
}

export interface CreateOneWorkflowTriggerInput {
    workflowTrigger: CreateWorkflowTriggerInput;
}

export interface CreateWorkflowTriggerInput {
    workflow: string;
    integrationTrigger: string;
    inputs: JSONObject;
    credentials?: Nullable<string>;
    schedule?: Nullable<JSONObject>;
    enabled?: Nullable<boolean>;
    maxConsecutiveFailures?: Nullable<number>;
}

export interface CreateManyWorkflowTriggersInput {
    workflowTriggers: CreateWorkflowTriggerInput[];
}

export interface UpdateOneWorkflowTriggerInput {
    id: string;
    update: UpdateWorkflowTriggerInput;
}

export interface UpdateWorkflowTriggerInput {
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<string>;
    schedule?: Nullable<JSONObject>;
    enabled?: Nullable<boolean>;
    maxConsecutiveFailures?: Nullable<number>;
}

export interface UpdateManyWorkflowTriggersInput {
    filter: WorkflowTriggerUpdateFilter;
    update: UpdateWorkflowTriggerInput;
}

export interface WorkflowTriggerUpdateFilter {
    and?: Nullable<WorkflowTriggerUpdateFilter[]>;
    or?: Nullable<WorkflowTriggerUpdateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
}

export interface DeleteOneWorkflowTriggerInput {
    id: string;
}

export interface DeleteManyWorkflowTriggersInput {
    filter: WorkflowTriggerDeleteFilter;
}

export interface WorkflowTriggerDeleteFilter {
    and?: Nullable<WorkflowTriggerDeleteFilter[]>;
    or?: Nullable<WorkflowTriggerDeleteFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    owner?: Nullable<IDFilterComparison>;
    workflow?: Nullable<IDFilterComparison>;
}

export interface IntegrationAccount {
    id: string;
    createdAt: DateTime;
    key: string;
    name: string;
    description?: Nullable<string>;
    authType: IntegrationAuthType;
    fieldsSchema?: Nullable<JSONObject>;
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
    hasNextPage?: Nullable<boolean>;
    hasPreviousPage?: Nullable<boolean>;
    startCursor?: Nullable<ConnectionCursor>;
    endCursor?: Nullable<ConnectionCursor>;
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
    description?: Nullable<string>;
    deprecated: boolean;
    category?: Nullable<string>;
    skipAuth: boolean;
    schemaRequest: JSONObject;
    schemaResponse?: Nullable<JSONObject>;
    instant: boolean;
    isWebhook: boolean;
    hookInstructions?: Nullable<string>;
    integrationAction: IntegrationAction;
}

export interface OperationCategory {
    key: string;
    name: string;
    description?: Nullable<string>;
    numberOfActions: number;
    numberOfTriggers: number;
}

export interface Integration {
    id: string;
    createdAt: DateTime;
    key: string;
    name: string;
    logo?: Nullable<string>;
    version: string;
    deprecated: boolean;
    parentKey?: Nullable<string>;
    integrationAccount?: Nullable<IntegrationAccount>;
    integrationCategories: string;
    operationCategories?: Nullable<OperationCategory[]>;
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
    description?: Nullable<string>;
    deprecated: boolean;
    category?: Nullable<string>;
    skipAuth: boolean;
    schemaRequest: JSONObject;
    schemaResponse?: Nullable<JSONObject>;
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
    name?: Nullable<string>;
    website?: Nullable<string>;
    company?: Nullable<string>;
    apiKey?: Nullable<string>;
}

export interface AccountCredential {
    id: string;
    createdAt: DateTime;
    owner: User;
    integrationAccount: IntegrationAccount;
    name: string;
    fields?: Nullable<JSONObject>;
    schemaRefs?: Nullable<JSONObject>;
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

export interface WorkflowNextAction {
    action: WorkflowAction;
    condition?: Nullable<string>;
}

export interface WorkflowAction {
    id: string;
    createdAt: DateTime;
    owner: User;
    workflow: Workflow;
    isRootAction: boolean;
    integrationAction: IntegrationAction;
    name: string;
    inputs?: Nullable<JSONObject>;
    nextActions?: Nullable<WorkflowNextAction[]>;
    credentials?: Nullable<AccountCredential>;
    schemaResponse?: Nullable<JSONObject>;
}

export interface WorkflowTrigger {
    id: string;
    createdAt: DateTime;
    owner: User;
    workflow: Workflow;
    integrationTrigger: IntegrationTrigger;
    name: string;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<AccountCredential>;
    schedule?: Nullable<JSONObject>;
    enabled: boolean;
    maxConsecutiveFailures: number;
    hookId?: Nullable<string>;
    schemaResponse?: Nullable<JSONObject>;
}

export interface Workflow {
    id: string;
    createdAt: DateTime;
    owner: User;
    project: Project;
    name: string;
    slug: string;
    state?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    trigger?: Nullable<WorkflowTrigger>;
    actions?: Nullable<WorkflowActionsConnection>;
}

export interface WorkflowDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    owner?: Nullable<string>;
    project?: Nullable<string>;
    name?: Nullable<string>;
    slug?: Nullable<string>;
    state?: Nullable<string>;
    runOnFailure?: Nullable<string>;
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
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    owner?: Nullable<string>;
    name?: Nullable<string>;
    public?: Nullable<boolean>;
    slug?: Nullable<string>;
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
    error?: Nullable<string>;
}

export interface ResetPasswordPayload {
    result: boolean;
}

export interface CompletePasswordPayload {
    error?: Nullable<string>;
}

export interface CompleteExternalAuthPayload {
    user: User;
    token: AuthToken;
    project?: Nullable<Project>;
}

export interface WorkflowRunAction {
    id: string;
    createdAt: DateTime;
    workflowAction: WorkflowAction;
    integrationName: string;
    operationName: string;
    status: WorkflowRunStatus;
    finishedAt?: Nullable<DateTime>;
}

export interface WorkflowRunTrigger {
    workflowTrigger: WorkflowTrigger;
    integrationName: string;
    operationName: string;
    status: WorkflowRunStatus;
    workflowTriggered?: Nullable<boolean>;
    triggerIds?: Nullable<string[]>;
    finishedAt?: Nullable<DateTime>;
}

export interface WorkflowRun {
    id: string;
    createdAt: DateTime;
    workflow: Workflow;
    status: WorkflowRunStatus;
    triggerRun?: Nullable<WorkflowRunTrigger>;
    actionRuns: WorkflowRunAction[];
    startedBy: WorkflowRunStartedByOptions;
    operationsUsed: number;
    errorMessage?: Nullable<string>;
    errorResponse?: Nullable<string>;
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
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    owner?: Nullable<string>;
    workflow?: Nullable<string>;
    integrationTrigger?: Nullable<string>;
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<AccountCredential>;
    schedule?: Nullable<JSONObject>;
    enabled?: Nullable<boolean>;
    maxConsecutiveFailures?: Nullable<number>;
    hookId?: Nullable<string>;
    schemaResponse?: Nullable<JSONObject>;
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
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    owner?: Nullable<string>;
    workflow?: Nullable<string>;
    isRootAction?: Nullable<boolean>;
    integrationAction?: Nullable<string>;
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    nextActions?: Nullable<WorkflowNextAction[]>;
    credentials?: Nullable<string>;
    schemaResponse?: Nullable<JSONObject>;
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
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    owner?: Nullable<string>;
    integrationAccount?: Nullable<string>;
    name?: Nullable<string>;
    fields?: Nullable<JSONObject>;
    schemaRefs?: Nullable<JSONObject>;
}

export interface AccountCredentialEdge {
    node: AccountCredential;
    cursor: ConnectionCursor;
}

export interface AccountCredentialConnection {
    pageInfo: PageInfo;
    edges: AccountCredentialEdge[];
}

export interface AsyncSchema {
    schemas: JSONObject;
}

export interface ContractSchema {
    id: string;
    chainId: number;
    address: string;
    schema: JSONObject;
}

export interface IQuery {
    user(id: string): User | Promise<User>;
    viewer(): User | Promise<User>;
    accountCredential(id: string): AccountCredential | Promise<AccountCredential>;
    accountCredentials(paging?: Nullable<CursorPaging>, filter?: Nullable<AccountCredentialFilter>, sorting?: Nullable<AccountCredentialSort[]>): AccountCredentialConnection | Promise<AccountCredentialConnection>;
    integration(id: string): Integration | Promise<Integration>;
    integrations(search?: Nullable<string>, paging?: Nullable<CursorPaging>, filter?: Nullable<IntegrationFilter>, sorting?: Nullable<IntegrationSort[]>): IntegrationConnection | Promise<IntegrationConnection>;
    integrationCategories(): IntegrationCategory[] | Promise<IntegrationCategory[]>;
    integrationCategory(id: string): Nullable<IntegrationCategory> | Promise<Nullable<IntegrationCategory>>;
    integrationAccount(id: string): IntegrationAccount | Promise<IntegrationAccount>;
    integrationAccounts(paging?: Nullable<CursorPaging>, filter?: Nullable<IntegrationAccountFilter>, sorting?: Nullable<IntegrationAccountSort[]>): IntegrationAccountConnection | Promise<IntegrationAccountConnection>;
    integrationAction(id: string): IntegrationAction | Promise<IntegrationAction>;
    integrationActions(search?: Nullable<string>, paging?: Nullable<CursorPaging>, filter?: Nullable<IntegrationActionFilter>, sorting?: Nullable<IntegrationActionSort[]>): IntegrationActionConnection | Promise<IntegrationActionConnection>;
    integrationTrigger(id: string): IntegrationTrigger | Promise<IntegrationTrigger>;
    integrationTriggers(search?: Nullable<string>, paging?: Nullable<CursorPaging>, filter?: Nullable<IntegrationTriggerFilter>, sorting?: Nullable<IntegrationTriggerSort[]>): IntegrationTriggerConnection | Promise<IntegrationTriggerConnection>;
    workflow(id: string): Workflow | Promise<Workflow>;
    workflows(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowFilter>, sorting?: Nullable<WorkflowSort[]>): WorkflowConnection | Promise<WorkflowConnection>;
    project(id: string): Project | Promise<Project>;
    projects(paging?: Nullable<CursorPaging>, filter?: Nullable<ProjectFilter>, sorting?: Nullable<ProjectSort[]>): ProjectConnection | Promise<ProjectConnection>;
    workflowAction(id: string): WorkflowAction | Promise<WorkflowAction>;
    workflowActions(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowActionFilter>, sorting?: Nullable<WorkflowActionSort[]>): WorkflowActionConnection | Promise<WorkflowActionConnection>;
    workflowNextAction(id: string): WorkflowNextAction | Promise<WorkflowNextAction>;
    workflowNextActions(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowNextActionFilter>, sorting?: Nullable<WorkflowNextActionSort[]>): WorkflowNextActionConnection | Promise<WorkflowNextActionConnection>;
    workflowTrigger(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    workflowTriggers(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowTriggerFilter>, sorting?: Nullable<WorkflowTriggerSort[]>): WorkflowTriggerConnection | Promise<WorkflowTriggerConnection>;
    workflowRun(id: string): WorkflowRun | Promise<WorkflowRun>;
    workflowRuns(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowRunFilter>, sorting?: Nullable<WorkflowRunSort[]>): WorkflowRunConnection | Promise<WorkflowRunConnection>;
    workflowRunTrigger(id: string): WorkflowRunTrigger | Promise<WorkflowRunTrigger>;
    workflowRunTriggers(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowRunTriggerFilter>, sorting?: Nullable<WorkflowRunTriggerSort[]>): WorkflowRunTriggerConnection | Promise<WorkflowRunTriggerConnection>;
    workflowRunAction(id: string): WorkflowRunAction | Promise<WorkflowRunAction>;
    workflowRunActions(paging?: Nullable<CursorPaging>, filter?: Nullable<WorkflowRunActionFilter>, sorting?: Nullable<WorkflowRunActionSort[]>): WorkflowRunActionConnection | Promise<WorkflowRunActionConnection>;
    contractSchema(chainId: number, address: string, type: string): ContractSchema | Promise<ContractSchema>;
    asyncSchemas(integrationId: string, accountCredentialId: string, names: string[], inputs?: Nullable<JSONObject>, integrationTriggerId?: Nullable<string>, integrationActionId?: Nullable<string>): AsyncSchema | Promise<AsyncSchema>;
}

export interface IMutation {
    login(username: string, password: string): LoginPayload | Promise<LoginPayload>;
    register(email: string, username: string, password: string): RegisterPayload | Promise<RegisterPayload>;
    logout(): boolean | Promise<boolean>;
    getAccessToken(): string | Promise<string>;
    verifyEmail(username: string, code: string): VerifyEmailPayload | Promise<VerifyEmailPayload>;
    requestPasswordReset(email: string): ResetPasswordPayload | Promise<ResetPasswordPayload>;
    completePasswordReset(username: string, code: string, password: string): CompletePasswordPayload | Promise<CompletePasswordPayload>;
    completeExternalAuth(id: string, code: string, username: string, email: string): CompleteExternalAuthPayload | Promise<CompleteExternalAuthPayload>;
    updateOneUser(input: UpdateOneUserInput): User | Promise<User>;
    changePassword(oldPassword: string, newPassword: string): User | Promise<User>;
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
type Nullable<T> = T | null;
