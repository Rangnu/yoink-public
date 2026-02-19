Perfect ✅
Here’s a **ready-to-use `To_Another_Github_Repo.md`** that clearly explains what to do when you want to **change a Git repository’s remote (e.g., move your local project to another GitHub repo)**.

---

```markdown
# 🔄 Changing Git Remote Repository (Step-by-Step Guide)

Sometimes you start working on a local Git project linked to one repository,  
but later you want to connect it to another (for example, after creating a new GitHub repo).  
This guide explains exactly what to do.

---

## 🧭 Scenario

You have a local project that’s currently linked to an old GitHub repository  
and you want to switch it to a new one.

Example:
```

Old Repo → [https://github.com/YourUser/OldRepo.git](https://github.com/YourUser/OldRepo.git)
New Repo → [git@github.com](mailto:git@github.com):YourUser/NewRepo.git

````

---

## ⚙️ Steps

### 1️⃣ Check current remote
```bash
git remote -v
````

This shows which repository your local project is currently linked to.

Example output:

```
origin  https://github.com/YourUser/OldRepo.git (fetch)
origin  https://github.com/YourUser/OldRepo.git (push)
```

---

### 2️⃣ Change the remote to the new repository

```bash
git remote set-url origin git@github.com:YourUser/NewRepo.git
```

🔹 **Explanation:**
This updates your current remote (`origin`) to point to the new repository.
Your commits, branches, and local files all remain intact.

---

### 3️⃣ Verify the change

```bash
git remote -v
```

✅ Expected output:

```
origin  git@github.com:YourUser/NewRepo.git (fetch)
origin  git@github.com:YourUser/NewRepo.git (push)
```

---

### 4️⃣ Test your SSH connection (optional but recommended)

```bash
ssh -T git@github.com
```

If you see:

```
Hi YourUser! You've successfully authenticated, but GitHub does not provide shell access.
```

then your SSH setup is working.

If not, [set up your SSH key on GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

---

### 5️⃣ Push your local code to the new repository

```bash
git push -u origin main
```

🔹 **Explanation:**
This uploads your local branch (`main`) to your new GitHub repo.
The `-u` flag sets `origin/main` as the default upstream branch so you can simply use `git push` next time.

---

## 🧠 Optional Commands

| Purpose                   | Command                                                     | Description                     |
| ------------------------- | ----------------------------------------------------------- | ------------------------------- |
| Rename existing remote    | `git remote rename origin old-origin`                       | Keeps the old one for reference |
| Remove the current remote | `git remote remove origin`                                  | Delete the existing remote link |
| Add a new remote manually | `git remote add origin git@github.com:YourUser/NewRepo.git` | Create a new remote link        |

---

## ✅ Summary (Cheat Sheet)

| Action               | Command                                    |
| -------------------- | ------------------------------------------ |
| View current remotes | `git remote -v`                            |
| Change remote        | `git remote set-url origin <new_repo_url>` |
| Test SSH connection  | `ssh -T git@github.com`                    |
| Push code            | `git push -u origin main`                  |

---

### 💡 Example

```bash
git remote -v
git remote set-url origin git@github.com:Rangnu/Stonket.git
git remote -v
ssh -T git@github.com
git push -u origin main
```

---

### 🎉 Done!

Your local repository is now linked to your new GitHub repo.
From now on, you can simply use:

```bash
git add .
git commit -m "Your message"
git push
```

to update your project.

---

**Author:** [Your Name]
**Last Updated:** October 2025

```

---

Would you like me to customize this `README.md` with your GitHub username (`Rangnu`) and project name (`Stonket`) before I generate the file for download?
```
