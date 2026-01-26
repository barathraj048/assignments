using GroceryOrderSystem.API.DTOs;

namespace GroceryOrderSystem.API.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetAllProductsAsync();
}