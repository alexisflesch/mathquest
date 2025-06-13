# Troubleshooting Guide

This directory contains troubleshooting documentation for common issues in the MathQuest application.

## Common Issues

- [Question Data Structure Mapping](question-data-mapping.md) - Issues with questions appearing empty in teacher dashboard
- [API Response Format Changes](api-response-format.md) - Problems caused by API format evolution
- [Socket Connection Issues](socket-connection.md) - Real-time communication problems
- [Authentication Problems](authentication.md) - Login and token-related issues

## General Debugging Steps

1. **Check Browser Console** - Most frontend issues will show errors in the browser console
2. **Check Backend Logs** - Server-side issues will appear in the backend logs
3. **Verify API Responses** - Use browser dev tools to inspect network requests
4. **Check Socket Events** - Monitor socket.io events in browser dev tools
5. **Review Documentation** - Check if the issue is documented in this troubleshooting guide

## Getting Help

If you can't find a solution in this guide:

1. Check existing GitHub issues
2. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Browser console errors
   - Backend log output
   - Screenshots if applicable

## Contributing

When you solve a new issue, please document it in this troubleshooting guide to help future developers.
