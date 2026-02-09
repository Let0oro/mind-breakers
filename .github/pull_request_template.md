## 🚀 Type of PR
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Chore (Dependencies/Config)

## 📝 Description
- **Summary**: Brief explanation of the changes.
- **Database Changes**: [ ] Yes / [ ] No (Does this PR include Prisma migrations?)
- **Environment Variables**: [ ] Yes / [ ] No (Are there new keys to add in Heroku/Config Vars?)

## 🛠️ How to test?
1. Run `yarn install` or `npm install`.
2. Run `npx prisma generate` to update the client.
3. Start the server with `yarn dev`.
4. Test the following endpoint(s):
   - `GET /api/auth/verify`
   - ...

## 🔗 Related Issue
- Closes #ID
