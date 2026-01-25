export enum ErrorMessage {
  MissingClusterIdentifier = 'Missing cluster identifier.',
  ClusterLoadFailed = 'We could not load this cluster.',
  ClusterServiceUnavailable = 'We could not reach the clustering service.',
  NoItemsFound = 'No items found.',
}

export enum ValidationMessage {
  QueryRequired = 'Search query is required',
  QueryMinLength = 'Search query must be at least 2 characters',
}

export enum UILabel {
  Back = 'Back',
  Clusterize = 'Clusterize',
  ComingSoon = 'Coming soon...',
  ClusteredThemes = 'Clustered themes',
  UnsortedIdeas = 'Unsorted ideas',
  ClusterSearchSuggestions = 'Cluster search suggestions',
  GenerateContent = 'Generate content for this cluster',
}

export enum UIPlaceholder {
  SearchQuery = 'Try: how to sell a house',
}

export enum AriaLabel {
  SearchQueryInput = 'Search query to cluster suggestions',
  SubmitQuery = 'Submit search query for clustering',
  BackToHome = 'Go back to home page',
  FeatureComingSoon = 'Feature coming soon',
  Loading = 'Loading',
}

export enum StatusMessage {
  LoadingClusterDetails = 'Loading cluster details…',
  ProcessingSearchSuggestions = 'Processing search suggestions…',
}

export enum StorageKey {
  ClusterResponse = 'cluster-response',
  ClusterJobPrefix = 'cluster-job',
}
