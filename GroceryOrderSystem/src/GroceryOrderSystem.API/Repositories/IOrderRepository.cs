using GroceryOrderSystem.API.Models;

namespace GroceryOrderSystem.API.Repositories;

public interface IOrderRepository
{
    Task<Order> CreateAsync(Order order);
}