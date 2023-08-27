
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
    openIdConnect = "openIdConnect",
    custom = "custom"
}

export enum IntegrationTriggerSortFields {
    id = "id",
    createdAt = "createdAt",
    integration = "integration",
    key = "key",
    name = "name",
    unlisted = "unlisted",
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

export enum OperationType {
    OffChain = "OffChain",
    EVM = "EVM"
}

export enum IntegrationActionSortFields {
    id = "id",
    createdAt = "createdAt",
    integration = "integration",
    key = "key",
    name = "name",
    unlisted = "unlisted",
    deprecated = "deprecated",
    category = "category",
    type = "type",
    skipAuth = "skipAuth"
}

export enum WorkflowActionSortFields {
    id = "id",
    createdAt = "createdAt",
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
    name = "name",
    type = "type"
}

export enum TemplateSortFields {
    id = "id",
    createdAt = "createdAt",
    name = "name",
    type = "type",
    integrationKey = "integrationKey"
}

export enum WorkflowNextActionSortFields {
    action = "action"
}

export enum WorkflowTriggerSortFields {
    id = "id",
    createdAt = "createdAt",
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

export enum ContactSortFields {
    id = "id",
    createdAt = "createdAt"
}

export enum CampaignSortFields {
    id = "id",
    createdAt = "createdAt"
}

export enum MenuSortFields {
    id = "id",
    createdAt = "createdAt"
}

export enum OrderSortFields {
    id = "id",
    createdAt = "createdAt"
}

export enum UserDatabaseSortFields {
    id = "id",
    createdAt = "createdAt"
}

export enum UserDatabaseItemSortFields {
    id = "id",
    createdAt = "createdAt"
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
    unlisted?: Nullable<BooleanFieldComparison>;
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
    unlisted?: Nullable<BooleanFieldComparison>;
    deprecated?: Nullable<BooleanFieldComparison>;
    category?: Nullable<StringFieldComparison>;
    type?: Nullable<OperationTypeFilterComparison>;
    skipAuth?: Nullable<BooleanFieldComparison>;
}

export interface OperationTypeFilterComparison {
    is?: Nullable<boolean>;
    isNot?: Nullable<boolean>;
    eq?: Nullable<OperationType>;
    neq?: Nullable<OperationType>;
    gt?: Nullable<OperationType>;
    gte?: Nullable<OperationType>;
    lt?: Nullable<OperationType>;
    lte?: Nullable<OperationType>;
    like?: Nullable<OperationType>;
    notLike?: Nullable<OperationType>;
    iLike?: Nullable<OperationType>;
    notILike?: Nullable<OperationType>;
    in?: Nullable<OperationType[]>;
    notIn?: Nullable<OperationType[]>;
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
    name?: Nullable<StringFieldComparison>;
    type?: Nullable<StringFieldComparison>;
}

export interface WorkflowSort {
    field: WorkflowSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface TemplateFilter {
    and?: Nullable<TemplateFilter[]>;
    or?: Nullable<TemplateFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
    name?: Nullable<StringFieldComparison>;
    type?: Nullable<StringFieldComparison>;
    integrationKey?: Nullable<StringFieldComparison>;
}

export interface TemplateSort {
    field: TemplateSortFields;
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

export interface ContactFilter {
    and?: Nullable<ContactFilter[]>;
    or?: Nullable<ContactFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface ContactSort {
    field: ContactSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface CampaignFilter {
    and?: Nullable<CampaignFilter[]>;
    or?: Nullable<CampaignFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface CampaignSort {
    field: CampaignSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface MenuFilter {
    and?: Nullable<MenuFilter[]>;
    or?: Nullable<MenuFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface MenuSort {
    field: MenuSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface OrderFilter {
    and?: Nullable<OrderFilter[]>;
    or?: Nullable<OrderFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface OrderSort {
    field: OrderSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface UserDatabaseFilter {
    and?: Nullable<UserDatabaseFilter[]>;
    or?: Nullable<UserDatabaseFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface UserDatabaseSort {
    field: UserDatabaseSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface UserDatabaseItemFilter {
    and?: Nullable<UserDatabaseItemFilter[]>;
    or?: Nullable<UserDatabaseItemFilter[]>;
    id?: Nullable<IDFilterComparison>;
    createdAt?: Nullable<DateFieldComparison>;
}

export interface UserDatabaseItemSort {
    field: UserDatabaseItemSortFields;
    direction: SortDirection;
    nulls?: Nullable<SortNulls>;
}

export interface UpdateOneUserInput {
    id: string;
    update: UpdateUserInput;
}

export interface UpdateUserInput {
    name?: Nullable<string>;
    email?: Nullable<string>;
    subscribedToNotifications?: Nullable<boolean>;
    subscribedToNewsletter?: Nullable<boolean>;
    features?: Nullable<JSONObject>;
}

export interface CreateOneAccountCredentialInput {
    accountCredential: CreateAccountCredentialInput;
}

export interface CreateAccountCredentialInput {
    integrationAccount: string;
    name: string;
    credentialInputs?: Nullable<JSONObject>;
    fields?: Nullable<JSONObject>;
}

export interface UpdateOneAccountCredentialInput {
    id: string;
    update: UpdateAccountCredentialInput;
}

export interface UpdateAccountCredentialInput {
    name?: Nullable<string>;
    credentialInputs?: Nullable<JSONObject>;
    fields?: Nullable<JSONObject>;
}

export interface DeleteOneAccountCredentialInput {
    id: string;
}

export interface CreateOneWorkflowInput {
    workflow: CreateWorkflowInput;
}

export interface CreateWorkflowInput {
    name: string;
    type?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    isPublic?: Nullable<boolean>;
    templateSchema?: Nullable<JSONObject>;
}

export interface UpdateOneWorkflowInput {
    id: string;
    update: UpdateWorkflowInput;
}

export interface UpdateWorkflowInput {
    name?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    isPublic?: Nullable<boolean>;
    templateSchema?: Nullable<JSONObject>;
}

export interface DeleteOneWorkflowInput {
    id: string;
}

export interface CreateOneWorkflowActionInput {
    workflowAction: CreateWorkflowActionInput;
}

export interface CreateWorkflowActionInput {
    name?: Nullable<string>;
    workflow: string;
    integrationAction: string;
    inputs: JSONObject;
    previousAction?: Nullable<string>;
    previousActionCondition?: Nullable<string>;
    nextAction?: Nullable<string>;
    credentials?: Nullable<string>;
}

export interface UpdateOneWorkflowActionInput {
    id: string;
    update: UpdateWorkflowActionInput;
}

export interface UpdateWorkflowActionInput {
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<string>;
    address?: Nullable<string>;
    nextActions?: Nullable<WorkflowNextActionInput[]>;
}

export interface WorkflowNextActionInput {
    action: string;
    condition?: Nullable<string>;
}

export interface DeleteOneWorkflowActionInput {
    id: string;
}

export interface CreateOneWorkflowTriggerInput {
    workflowTrigger: CreateWorkflowTriggerInput;
}

export interface CreateWorkflowTriggerInput {
    name?: Nullable<string>;
    workflow: string;
    integrationTrigger: string;
    inputs: JSONObject;
    credentials?: Nullable<string>;
    schedule?: Nullable<JSONObject>;
    enabled?: Nullable<boolean>;
    maxConsecutiveFailures?: Nullable<number>;
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

export interface DeleteOneWorkflowTriggerInput {
    id: string;
}

export interface CreateOneContactInput {
    contact: CreateContact;
}

export interface CreateContact {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    address?: Nullable<string>;
    tags?: Nullable<string[]>;
}

export interface UpdateOneContactInput {
    id: string;
    update: UpdateContact;
}

export interface UpdateContact {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    address?: Nullable<string>;
    tags?: Nullable<string[]>;
}

export interface DeleteOneContactInput {
    id: string;
}

export interface CreateOneCampaignInput {
    campaign: CreateCampaignInput;
}

export interface CreateCampaignInput {
    accountCredentialId: string;
    name: string;
    message: string;
    includeTags?: Nullable<string[]>;
    excludeTags?: Nullable<string[]>;
}

export interface UpdateOneCampaignInput {
    id: string;
    update: UpdateCampaignInput;
}

export interface UpdateCampaignInput {
    name?: Nullable<string>;
}

export interface DeleteOneCampaignInput {
    id: string;
}

export interface CreateOneMenuInput {
    menu: CreateMenuInput;
}

export interface CreateMenuInput {
    name: string;
    currency?: Nullable<string>;
    items: CreateMenuItemInput[];
}

export interface CreateMenuItemInput {
    name: string;
    price?: Nullable<number>;
}

export interface UpdateOneMenuInput {
    id: string;
    update: UpdateMenuInput;
}

export interface UpdateMenuInput {
    name?: Nullable<string>;
    currency?: Nullable<string>;
    items?: Nullable<UpdateMenuItemInput[]>;
}

export interface UpdateMenuItemInput {
    name?: Nullable<string>;
    price?: Nullable<number>;
}

export interface DeleteOneMenuInput {
    id: string;
}

export interface CreateOneOrderInput {
    order: CreateOrderInput;
}

export interface CreateOrderInput {
    address: string;
    total?: Nullable<number>;
    state: string;
    items: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
    name: string;
    quantity: number;
}

export interface UpdateOneOrderInput {
    id: string;
    update: UpdateOrderInput;
}

export interface UpdateOrderInput {
    address?: Nullable<string>;
    total?: Nullable<number>;
    state?: Nullable<string>;
    items?: Nullable<UpdateOrderItemInput[]>;
}

export interface UpdateOrderItemInput {
    name?: Nullable<string>;
    quantity?: Nullable<number>;
}

export interface DeleteOneOrderInput {
    id: string;
}

export interface CreateOneUserDatabaseInput {
    userDatabase: CreateUserDatabase;
}

export interface CreateUserDatabase {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface UpdateOneUserDatabaseInput {
    id: string;
    update: UpdateUserDatabase;
}

export interface UpdateUserDatabase {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface DeleteOneUserDatabaseInput {
    id: string;
}

export interface CreateOneUserDatabaseItemInput {
    userDatabaseItem: CreateUserDatabaseItem;
}

export interface CreateUserDatabaseItem {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface UpdateOneUserDatabaseItemInput {
    id: string;
    update: UpdateUserDatabaseItem;
}

export interface UpdateUserDatabaseItem {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface DeleteOneUserDatabaseItemInput {
    id: string;
}

export interface User {
    id: string;
    createdAt: DateTime;
    email?: Nullable<string>;
    externalApps?: Nullable<JSONObject>;
    operationsUsedMonth: number;
    operationsReset: DateTime;
    plan: string;
    nextPlan?: Nullable<string>;
    planPeriodEnd?: Nullable<DateTime>;
    name?: Nullable<string>;
    subscribedToNotifications: boolean;
    subscribedToNewsletter: boolean;
    features?: Nullable<JSONObject>;
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
    unlisted: boolean;
    deprecated: boolean;
    category?: Nullable<string>;
    skipAuth: boolean;
    pinned: boolean;
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
    unlisted: boolean;
    deprecated: boolean;
    category?: Nullable<string>;
    type: OperationType;
    skipAuth: boolean;
    pinned: boolean;
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

export interface MenuItem {
    name: string;
    price: number;
}

export interface Menu {
    id: string;
    createdAt: DateTime;
    name: string;
    currency?: Nullable<string>;
    items: MenuItem[];
}

export interface Contact {
    id: string;
    createdAt: DateTime;
    address: string;
    tags?: Nullable<string[]>;
}

export interface AccountCredential {
    id: string;
    createdAt: DateTime;
    integrationAccount: IntegrationAccount;
    name: string;
    fields?: Nullable<JSONObject>;
    schemaRefs?: Nullable<JSONObject>;
    authExpired: boolean;
}

export interface OrderItem {
    name: string;
    quantity: number;
}

export interface Order {
    id: string;
    createdAt: DateTime;
    address: string;
    total: number;
    state: string;
    items: OrderItem[];
}

export interface UserDatabase {
    id: string;
    createdAt: DateTime;
}

export interface UserDatabaseItem {
    id: string;
    createdAt: DateTime;
    database: UserDatabase;
}

export interface WorkflowNextAction {
    action: WorkflowAction;
    condition?: Nullable<string>;
}

export interface WorkflowAction {
    id: string;
    createdAt: DateTime;
    workflow: Workflow;
    isRootAction: boolean;
    integrationAction: IntegrationAction;
    name: string;
    inputs?: Nullable<JSONObject>;
    nextActions?: Nullable<WorkflowNextAction[]>;
    lastItem?: Nullable<JSONObject>;
    credentials?: Nullable<AccountCredential>;
    schemaResponse?: Nullable<JSONObject>;
    type: OperationType;
    address: string;
}

export interface Workflow {
    id: string;
    createdAt: DateTime;
    ownerAddress: string;
    name: string;
    state?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    address?: Nullable<string>;
    network?: Nullable<string>;
    type?: Nullable<string>;
    isTemplate?: Nullable<boolean>;
    isPublic: boolean;
    templateSchema?: Nullable<JSONObject>;
    usedIntegrations?: Nullable<string[]>;
    trigger?: Nullable<WorkflowTrigger>;
    actions?: Nullable<WorkflowActionsConnection>;
}

export interface WorkflowTrigger {
    id: string;
    createdAt: DateTime;
    workflow: Workflow;
    integrationTrigger: IntegrationTrigger;
    name: string;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<AccountCredential>;
    lastCheck?: Nullable<DateTime>;
    schedule?: Nullable<JSONObject>;
    enabled: boolean;
    numberOfActions: number;
    maxConsecutiveFailures: number;
    maxItemsPerRun: number;
    lastItem?: Nullable<JSONObject>;
    hookId?: Nullable<string>;
    schemaResponse?: Nullable<JSONObject>;
}

export interface RequestMigrationPayload {
    result: boolean;
}

export interface ResultPayload {
    success: boolean;
}

export interface UserCheckoutSessionPayload {
    sessionId: string;
}

export interface VerifyEmailPayload {
    error?: Nullable<string>;
}

export interface UserEdge {
    node: User;
    cursor: ConnectionCursor;
}

export interface CompileWorkflow {
    bytecode: string;
    abi: JSONObject[];
    sourcecode: string;
}

export interface WorkflowEdge {
    node: Workflow;
    cursor: ConnectionCursor;
}

export interface WorkflowConnection {
    pageInfo: PageInfo;
    edges: WorkflowEdge[];
}

export interface Template {
    id: string;
    createdAt: DateTime;
    ownerAddress: string;
    name: string;
    state?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    address?: Nullable<string>;
    network?: Nullable<string>;
    type?: Nullable<string>;
    isTemplate?: Nullable<boolean>;
    isPublic: boolean;
    templateSchema?: Nullable<JSONObject>;
    usedIntegrations?: Nullable<string[]>;
    trigger?: Nullable<WorkflowTrigger>;
    actions?: Nullable<WorkflowActionsConnection>;
    integrationKey?: Nullable<string>;
}

export interface TemplateEdge {
    node: Template;
    cursor: ConnectionCursor;
}

export interface WorkflowDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    ownerAddress?: Nullable<string>;
    name?: Nullable<string>;
    state?: Nullable<string>;
    runOnFailure?: Nullable<string>;
    address?: Nullable<string>;
    network?: Nullable<string>;
    type?: Nullable<string>;
    isTemplate?: Nullable<boolean>;
    isPublic?: Nullable<boolean>;
    templateSchema?: Nullable<JSONObject>;
    usedIntegrations?: Nullable<string[]>;
}

export interface WorkflowActionEdge {
    node: WorkflowAction;
    cursor: ConnectionCursor;
}

export interface WorkflowActionsConnection {
    pageInfo: PageInfo;
    edges: WorkflowActionEdge[];
    totalCount: number;
}

export interface BlockchainTransaction {
    chainId: number;
    hash: string;
}

export interface WorkflowRunAction {
    id: string;
    createdAt: DateTime;
    workflowAction: WorkflowAction;
    integrationName: string;
    operationName: string;
    itemId: string;
    status: WorkflowRunStatus;
    finishedAt?: Nullable<DateTime>;
    transactions?: Nullable<BlockchainTransaction[]>;
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
    totalItems?: Nullable<number>;
    itemsProcessed?: Nullable<number>;
    itemsFailed?: Nullable<number>;
    startedBy: WorkflowRunStartedByOptions;
    operationsUsed: number;
    errorMessage?: Nullable<string>;
    errorResponse?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
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

export interface Campaign {
    id: string;
    createdAt: DateTime;
    name: string;
    message: string;
    delivered: number;
    processed: number;
    total?: Nullable<number>;
    includeTags?: Nullable<string[]>;
    state: string;
}

export interface CampaignDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    name?: Nullable<string>;
    message?: Nullable<string>;
    delivered?: Nullable<number>;
    processed?: Nullable<number>;
    total?: Nullable<number>;
    includeTags?: Nullable<string[]>;
    state?: Nullable<string>;
}

export interface CampaignEdge {
    node: Campaign;
    cursor: ConnectionCursor;
}

export interface CampaignConnection {
    pageInfo: PageInfo;
    edges: CampaignEdge[];
    totalCount: number;
}

export interface ContactDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    address?: Nullable<string>;
    tags?: Nullable<string[]>;
}

export interface ContactEdge {
    node: Contact;
    cursor: ConnectionCursor;
}

export interface ContactConnection {
    pageInfo: PageInfo;
    edges: ContactEdge[];
    totalCount: number;
}

export interface MenuDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    name?: Nullable<string>;
    currency?: Nullable<string>;
    items?: Nullable<MenuItem[]>;
}

export interface MenuEdge {
    node: Menu;
    cursor: ConnectionCursor;
}

export interface MenuConnection {
    pageInfo: PageInfo;
    edges: MenuEdge[];
}

export interface OrderDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    address?: Nullable<string>;
    total?: Nullable<number>;
    state?: Nullable<string>;
    items?: Nullable<OrderItem[]>;
}

export interface OrderEdge {
    node: Order;
    cursor: ConnectionCursor;
}

export interface OrderConnection {
    pageInfo: PageInfo;
    edges: OrderEdge[];
}

export interface WorkflowTriggerDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    workflow?: Nullable<string>;
    integrationTrigger?: Nullable<string>;
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    credentials?: Nullable<AccountCredential>;
    lastCheck?: Nullable<DateTime>;
    schedule?: Nullable<JSONObject>;
    enabled?: Nullable<boolean>;
    numberOfActions?: Nullable<number>;
    maxConsecutiveFailures?: Nullable<number>;
    maxItemsPerRun?: Nullable<number>;
    lastItem?: Nullable<JSONObject>;
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
    workflow?: Nullable<string>;
    isRootAction?: Nullable<boolean>;
    integrationAction?: Nullable<string>;
    name?: Nullable<string>;
    inputs?: Nullable<JSONObject>;
    nextActions?: Nullable<WorkflowNextAction[]>;
    lastItem?: Nullable<JSONObject>;
    credentials?: Nullable<string>;
    schemaResponse?: Nullable<JSONObject>;
    type?: Nullable<OperationType>;
    address?: Nullable<string>;
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

export interface ConnectAccountDataPayload {
    data: JSONObject;
}

export interface AccountCredentialDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    integrationAccount?: Nullable<string>;
    name?: Nullable<string>;
    fields?: Nullable<JSONObject>;
    schemaRefs?: Nullable<JSONObject>;
    authExpired?: Nullable<boolean>;
}

export interface AccountCredentialEdge {
    node: AccountCredential;
    cursor: ConnectionCursor;
}

export interface AccountCredentialConnection {
    pageInfo: PageInfo;
    edges: AccountCredentialEdge[];
}

export interface ActionSendPrompt {
    integrationId: string;
    integrationName: string;
    integrationLogo?: Nullable<string>;
    id: string;
    name: string;
    description?: Nullable<string>;
    inputs: JSONObject;
}

export interface TriggerSendPrompt {
    integrationId: string;
    integrationName: string;
    integrationLogo?: Nullable<string>;
    id: string;
    name: string;
    description?: Nullable<string>;
    inputs: JSONObject;
    integrationAccountId?: Nullable<string>;
}

export interface SendPromptPayload {
    id: string;
    trigger: TriggerSendPrompt;
    actions: ActionSendPrompt[];
}

export interface AsyncSchema {
    schemas: JSONObject;
    schemaExtension: JSONObject;
}

export interface ContractSchema {
    id: string;
    chainId: number;
    address: string;
    schema: JSONObject;
}

export interface UserDatabaseItemDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface UserDatabaseItemEdge {
    node: UserDatabaseItem;
    cursor: ConnectionCursor;
}

export interface UserDatabaseItemConnection {
    pageInfo: PageInfo;
    edges: UserDatabaseItemEdge[];
}

export interface UserDatabaseDeleteResponse {
    id?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
}

export interface UserDatabaseEdge {
    node: UserDatabase;
    cursor: ConnectionCursor;
}

export interface UserDatabaseConnection {
    pageInfo: PageInfo;
    edges: UserDatabaseEdge[];
}

export interface IQuery {
    user(id: string): User | Promise<User>;
    viewer(): User | Promise<User>;
    accountCredential(id: string): AccountCredential | Promise<AccountCredential>;
    accountCredentials(paging?: Nullable<CursorPaging>, filter?: Nullable<AccountCredentialFilter>, sorting?: Nullable<AccountCredentialSort[]>): AccountCredentialConnection | Promise<AccountCredentialConnection>;
    accountCreationData(key: string): ConnectAccountDataPayload | Promise<ConnectAccountDataPayload>;
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
    compileWorkflow(workflowId: string): CompileWorkflow | Promise<CompileWorkflow>;
    recommendedTemplates(paging?: Nullable<CursorPaging>, filter?: Nullable<TemplateFilter>, sorting?: Nullable<TemplateSort[]>): WorkflowConnection | Promise<WorkflowConnection>;
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
    contact(id: string): Contact | Promise<Contact>;
    contacts(paging?: Nullable<CursorPaging>, filter?: Nullable<ContactFilter>, sorting?: Nullable<ContactSort[]>): ContactConnection | Promise<ContactConnection>;
    campaign(id: string): Campaign | Promise<Campaign>;
    campaigns(paging?: Nullable<CursorPaging>, filter?: Nullable<CampaignFilter>, sorting?: Nullable<CampaignSort[]>): CampaignConnection | Promise<CampaignConnection>;
    menu(id: string): Menu | Promise<Menu>;
    menus(paging?: Nullable<CursorPaging>, filter?: Nullable<MenuFilter>, sorting?: Nullable<MenuSort[]>): MenuConnection | Promise<MenuConnection>;
    order(id: string): Order | Promise<Order>;
    orders(paging?: Nullable<CursorPaging>, filter?: Nullable<OrderFilter>, sorting?: Nullable<OrderSort[]>): OrderConnection | Promise<OrderConnection>;
    contractSchema(chainId: number, address: string, type: string): ContractSchema | Promise<ContractSchema>;
    asyncSchemas(integrationId: string, accountCredentialId: string, names: string[], inputs?: Nullable<JSONObject>, integrationTriggerId?: Nullable<string>, integrationActionId?: Nullable<string>): AsyncSchema | Promise<AsyncSchema>;
    manyAsyncSchemas(asyncSchemaInputs: JSONObject[]): AsyncSchema | Promise<AsyncSchema>;
    userDatabase(id: string): UserDatabase | Promise<UserDatabase>;
    userDatabases(paging?: Nullable<CursorPaging>, filter?: Nullable<UserDatabaseFilter>, sorting?: Nullable<UserDatabaseSort[]>): UserDatabaseConnection | Promise<UserDatabaseConnection>;
    userDatabaseItem(id: string): UserDatabaseItem | Promise<UserDatabaseItem>;
    userDatabaseItems(paging?: Nullable<CursorPaging>, filter?: Nullable<UserDatabaseItemFilter>, sorting?: Nullable<UserDatabaseItemSort[]>): UserDatabaseItemConnection | Promise<UserDatabaseItemConnection>;
}

export interface IMutation {
    sendPrompt(prompt: string): SendPromptPayload | Promise<SendPromptPayload>;
    createWorkflowPrompt(id: string, credentialIds: JSONObject): SendPromptPayload | Promise<SendPromptPayload>;
    updateOneUser(input: UpdateOneUserInput): User | Promise<User>;
    createCheckoutSession(priceId: string): UserCheckoutSessionPayload | Promise<UserCheckoutSessionPayload>;
    resumeSubscription(): ResultPayload | Promise<ResultPayload>;
    changeSubscriptionPlan(priceId: string): ResultPayload | Promise<ResultPayload>;
    verifyEmail(address: string, code: string): VerifyEmailPayload | Promise<VerifyEmailPayload>;
    aiUseCase(use: string): ResultPayload | Promise<ResultPayload>;
    requestMigration(email: string): RequestMigrationPayload | Promise<RequestMigrationPayload>;
    completeMigration(email: string, code: string, data: string): RequestMigrationPayload | Promise<RequestMigrationPayload>;
    createOneAccountCredential(input: CreateOneAccountCredentialInput): AccountCredential | Promise<AccountCredential>;
    updateOneAccountCredential(input: UpdateOneAccountCredentialInput): AccountCredential | Promise<AccountCredential>;
    deleteOneAccountCredential(input: DeleteOneAccountCredentialInput): AccountCredentialDeleteResponse | Promise<AccountCredentialDeleteResponse>;
    createOneWorkflow(input: CreateOneWorkflowInput): Workflow | Promise<Workflow>;
    updateOneWorkflow(input: UpdateOneWorkflowInput): Workflow | Promise<Workflow>;
    deleteOneWorkflow(input: DeleteOneWorkflowInput): WorkflowDeleteResponse | Promise<WorkflowDeleteResponse>;
    forkWorkflow(workflowId: string, templateInputs?: Nullable<JSONObject>, credentialIds?: Nullable<JSONObject>): Workflow | Promise<Workflow>;
    createOneWorkflowAction(input: CreateOneWorkflowActionInput): WorkflowAction | Promise<WorkflowAction>;
    updateOneWorkflowAction(input: UpdateOneWorkflowActionInput): WorkflowAction | Promise<WorkflowAction>;
    deleteOneWorkflowAction(input: DeleteOneWorkflowActionInput): WorkflowActionDeleteResponse | Promise<WorkflowActionDeleteResponse>;
    testWorkflowAction(id: string): WorkflowAction | Promise<WorkflowAction>;
    createOneWorkflowTrigger(input: CreateOneWorkflowTriggerInput): WorkflowTrigger | Promise<WorkflowTrigger>;
    updateOneWorkflowTrigger(input: UpdateOneWorkflowTriggerInput): WorkflowTrigger | Promise<WorkflowTrigger>;
    deleteOneWorkflowTrigger(input: DeleteOneWorkflowTriggerInput): WorkflowTriggerDeleteResponse | Promise<WorkflowTriggerDeleteResponse>;
    checkWorkflowTrigger(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    testWorkflowTrigger(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    runWorkflowTriggerLastEvent(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    runWorkflowTriggerHistory(id: string): WorkflowTrigger | Promise<WorkflowTrigger>;
    createOneContact(input: CreateOneContactInput): Contact | Promise<Contact>;
    updateOneContact(input: UpdateOneContactInput): Contact | Promise<Contact>;
    deleteOneContact(input: DeleteOneContactInput): ContactDeleteResponse | Promise<ContactDeleteResponse>;
    addContacts(addresses: string[], tags?: Nullable<string[]>): ResultPayload | Promise<ResultPayload>;
    importXmtpContacts(tags?: Nullable<string[]>): ResultPayload | Promise<ResultPayload>;
    importPoapContacts(eventId: string, tags?: Nullable<string[]>): ResultPayload | Promise<ResultPayload>;
    importLensFollowersContacts(handle: string, tags?: Nullable<string[]>): ResultPayload | Promise<ResultPayload>;
    importLensCollectorsContacts(publicationId: string, tags?: Nullable<string[]>): ResultPayload | Promise<ResultPayload>;
    createOneCampaign(input: CreateOneCampaignInput): Campaign | Promise<Campaign>;
    updateOneCampaign(input: UpdateOneCampaignInput): Campaign | Promise<Campaign>;
    deleteOneCampaign(input: DeleteOneCampaignInput): CampaignDeleteResponse | Promise<CampaignDeleteResponse>;
    createOneMenu(input: CreateOneMenuInput): Menu | Promise<Menu>;
    updateOneMenu(input: UpdateOneMenuInput): Menu | Promise<Menu>;
    deleteOneMenu(input: DeleteOneMenuInput): MenuDeleteResponse | Promise<MenuDeleteResponse>;
    createOneOrder(input: CreateOneOrderInput): Order | Promise<Order>;
    updateOneOrder(input: UpdateOneOrderInput): Order | Promise<Order>;
    deleteOneOrder(input: DeleteOneOrderInput): OrderDeleteResponse | Promise<OrderDeleteResponse>;
    createOneUserDatabase(input: CreateOneUserDatabaseInput): UserDatabase | Promise<UserDatabase>;
    updateOneUserDatabase(input: UpdateOneUserDatabaseInput): UserDatabase | Promise<UserDatabase>;
    deleteOneUserDatabase(input: DeleteOneUserDatabaseInput): UserDatabaseDeleteResponse | Promise<UserDatabaseDeleteResponse>;
    createOneUserDatabaseItem(input: CreateOneUserDatabaseItemInput): UserDatabaseItem | Promise<UserDatabaseItem>;
    updateOneUserDatabaseItem(input: UpdateOneUserDatabaseItemInput): UserDatabaseItem | Promise<UserDatabaseItem>;
    deleteOneUserDatabaseItem(input: DeleteOneUserDatabaseItemInput): UserDatabaseItemDeleteResponse | Promise<UserDatabaseItemDeleteResponse>;
}

export type DateTime = any;
export type JSONObject = any;
export type ConnectionCursor = any;
type Nullable<T> = T | null;
