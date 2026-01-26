using GroceryOrderSystem.API.Models;

namespace GroceryOrderSystem.API.Repositories;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetByIdWithLockAsync(int id);
    Task UpdateAsync(Product product);
}