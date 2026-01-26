export enum ErrorMessage {
  MissingClusterIdentifier = 'Missing cluster identifier.',
  ClusterLoadFailed = 'We could not load this cluster.',
  ClusterServiceUnavailable = 'We could not reach the clustering service.',
  NoItemsFound = 'No items found.',
  NetworkError = 'Network error occurred. Please check your connection.',
  UnexpectedError = 'An unexpected error occurred. Please refresh the page.',
}

export enum ValidationMessage {
  QueryRequired = 'Search query is required',
  QueryMinLength = 'Type at least 3 characters',
}

export enum UILabel {
  Back = 'Back',
  Clusterize = 'Clusterize',
  ComingSoon = 'Coming soon...',
  ClusteredThemes = 'Grouped themes',
  UnsortedIdeas = 'Unsorted ideas',
  UnsortedKey = 'Unsorted key phrase',
  ClusterSearchSuggestions = 'Cluster search suggestions',
  GenerateContent = 'Generate content for this cluster',
  GenerateArticle = 'Generate an Article',
  Generating = 'Generating...',
  TryAgain = 'Try Again',
  GenerateImage = 'Generate an Image',
  CopyHtml = 'Copy HTML to clipboard',
}

export enum UIPlaceholder {
  SearchQuery = 'Try: how to sell a house',
}

export enum AriaLabel {
  SearchQueryInput = 'Search query to cluster suggestions',
  SubmitQuery = 'Submit search query for clustering',
  FeatureComingSoon = 'Feature coming soon',
  Loading = 'Loading',
  ArticleGenerating = 'Article is being generated',
}

export enum StatusMessage {
  LoadingClusterDetails = 'Loading cluster details…',
  ProcessingSearchSuggestions = 'Processing search suggestions…',
  ArticlePending = 'Starting article generation…',
  ArticleGenerating = 'Generating article content…',
  ArticleValidating = 'Validating microdata markup…',
  ArticleCompleted = 'Article generated successfully!',
  ArticleFailed = 'Article generation failed. Please try again.',
  ArticleTimeout = 'Article generation timed out. Please try again.',
}

export enum StorageKey {
  ClusterResponse = 'cluster-response',
  ClusterQuery = 'cluster-query',
  ClusterJobPrefix = 'cluster-job',
}

export const CLUSTER_COLORS = [
  { name: 'blue', bg: '#5B9BD5', border: '#4A7FB0' },
  { name: 'green', bg: '#70AD47', border: '#5A8C3A' },
  { name: 'purple', bg: '#9B7EBA', border: '#7E6599' },
  { name: 'orange', bg: '#ED7D31', border: '#C66428' },
  { name: 'teal', bg: '#4BACC6', border: '#3C8DA0' },
  { name: 'pink', bg: '#D57EA6', border: '#B06888' },
  { name: 'indigo', bg: '#7F8FA6', border: '#657285' },
  { name: 'amber', bg: '#C9A86A', border: '#A48855' },
] as const;

export const ORPHAN_COLOR = {
  name: 'slate',
  bg: '#8B96A3',
  border: '#6F7983',
} as const;
