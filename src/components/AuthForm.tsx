catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else if (typeof err === 'string') {
    setError(err);
  } else {
    setError('An unknown error occurred');
  }
}