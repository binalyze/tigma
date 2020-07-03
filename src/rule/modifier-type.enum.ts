export enum ModifierType
{
    // ---------------- Operators ------------------
    All = 'all',
    Contains = 'contains',
    EndsWith = 'endswith',
    StartsWith = 'startswith',
    Equals = 'equals',
    Eq = 'eq',
    Re = 're',
    GreaterThan = 'gt',
    GreaterThanOrEqual = 'gte',
    LessThan = 'lt',
    LessThanOrEqual = 'lte',

    // ---------------- Transformers ------------------
    Base64 = 'base64', //TODO(emre): Implement this
}
