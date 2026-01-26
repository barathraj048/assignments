using GroceryOrderSystem.API.Database;
using GroceryOrderSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GroceryOrderSystem.API.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync()
    {
        return await _context.Products.ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product?> GetByIdWithLockAsync(int id)
    {
        // SELECT ... FOR UPDATE to lock the row
        return await _context.Products
            .FromSqlRaw("SELECT * FROM products WHERE id = {0} FOR UPDATE", id)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }
}