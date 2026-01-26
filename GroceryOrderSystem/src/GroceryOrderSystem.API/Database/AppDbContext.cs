using GroceryOrderSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GroceryOrderSystem.API.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Add check constraints
        modelBuilder.Entity<Product>()
            .ToTable(t => t.HasCheckConstraint("CK_Product_Stock", "stock >= 0"));

        modelBuilder.Entity<Order>()
            .ToTable(t => t.HasCheckConstraint("CK_Order_Quantity", "quantity > 0"));
    }
}