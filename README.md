# **Discord Ticket System**  

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Discord%20Ticket%20System&fontSize=40&fontAlignY=35&desc=Advanced%20Support%20Solution%20•%20MongoDB%20•%20Discord.js%20v14&descSize=20&descAlignY=55&animation=fadeIn">
    <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:7289da,100:2c2f33&height=200&section=header&text=Discord%20Ticket%20System&fontSize=40&fontAlignY=35&desc=Advanced%20Support%20Solution%20•%20MongoDB%20•%20Discord.js%20v14&descSize=20&descAlignY=55&animation=fadeIn">
    <img alt="Ticket System Banner" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header">
  </picture>
</div>

A powerful and customizable ticket management solution for Discord, built with **Discord.js v14** and designed for seamless moderation and support.  

---

## **✨ Key Features**  

- **Multi-Category Tickets** – Support, Reports, Applications, and more  
- **Priority Levels** – Low, Medium, High, and Critical tagging  
- **Role-Based Access Control** – Custom permissions for staff and admins  
- **Ticket Claiming** – Staff can claim tickets to prevent duplicates  
- **Transcripts & Logging** – Full conversation history with export options  
- **User Management** – Add/remove users from tickets easily  
- **Modern UI** – Interactive buttons, dropdowns, and clean embeds  

---

## **📋 Requirements**  

- **Node.js v16.9+**  
- **MongoDB Database** (for ticket storage)  
- **Discord Bot Token** (with required permissions)  
- **Discord Server** (with admin access for setup)  

---

## **🚀 Installation**  

1. **Clone the repository**  
   ```bash
   git clone https://github.com/ramkrishna-xyz/Ticket-System.git
   cd ticket-system
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file with:  
   ```env
   TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_ID=your_bot_client_id
   ```

4. **Start the bot**  
   ```bash
   npm start
   ```

---

## **🔧 Commands**  

### **For Users**  
| Command | Description | Options |
|---------|-------------|---------|
| `/ticket create` | Open a new ticket | Category, Subject, Priority (optional) |
| `/ticket close` | Close your ticket | Reason (optional) |
| `/ticket info` | View ticket details | – |

### **For Staff**  
| Command | Description | Options |
|---------|-------------|---------|
| `/ticket add` | Add a user to the ticket | @User |
| `/ticket remove` | Remove a user from the ticket | @User |
| `/ticket claim` | Take ownership of a ticket | – |
| `/ticket transfer` | Move ticket to another category | New Category |

### **For Admins**  
| Command | Description | Options |
|---------|-------------|---------|
| `/ticket config` | Configure system settings | Setting, Value |
| `/ticket logs` | View ticket history | Ticket ID |
| `/ticket purge` | Bulk-close old tickets | Days (default: 30) |

---

## **📜 License**  
This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.  

---

## **💡 Support & Contributing**  
- **Found a bug?** Open an [Issue](https://github.com/ramkrishna-xyz/Ticket-System/issues)  
- **Want to contribute?** Submit a **Pull Request**!  
- **Need help?** Join our [Support Server](https://discord.gghFyj4Q4f2B)  

---

**Version:** 2.0.0  
**Last Updated:** December 2023  
**Compatible with:** Discord.js v14, Node.js v16+  
