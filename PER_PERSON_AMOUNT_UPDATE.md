# 💰 Per-Person Amount Update

## 🎯 **What You Wanted**

You want the amount entered to be the **amount each person pays**, not the total amount divided among members.

## ✅ **Changes Made**

### **1. Updated Label & Description**
- **Before**: "Total Amount (USDC)"
- **After**: "Amount Per Person (USDC)" with helper text "Each member will pay this amount"

### **2. Updated Payment Summary**
- **Before**: 
  - Total Amount: $100 USDC
  - Per Member: $50 USDC (for 2 members)
- **After**:
  - Amount Per Person: $100 USDC  
  - Total Pool Amount: $200 USDC (for 2 members)

### **3. Updated Payment Logic**
- **Before**: Uses entered amount as total
- **After**: Calculates total as `amount × number of members`

### **4. Updated API Call**
```javascript
// Before
amount: amount  // e.g., "100"

// After  
amount: totalPoolAmount  // e.g., "200" (100 × 2 members)
metadata: {
  amountPerPerson: amount  // Store original per-person amount
}
```

## 🧮 **Example with 2 Members**

### **Input**: 100 USDC per person

**Payment Summary Shows:**
- Group Members: 2
- Amount Per Person: $100 USDC
- Total Pool Amount: $200 USDC
- Payment Type: Simple Pool Payment

**What Happens:**
1. **Event created** with estimated total of $200 USDC
2. **Each member** gets individual payment link for $100 USDC
3. **Total collected** will be $200 USDC ($100 × 2)

## 🚀 **Ready to Test**

1. **Refresh your browser** to get the updated component
2. **Enter amount per person** (e.g., 100)
3. **See updated summary** showing total pool amount
4. **Create payment** - each member pays the amount you entered

The system now treats your input as the amount each person should pay! 🎉