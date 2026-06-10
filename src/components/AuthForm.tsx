const validateInput = (email, password) => {
  if (!email || !password) {
    return 'Please fill in all fields';
  }
  // ...