using GroceryOrderSystem.API.DTOs;

namespace GroceryOrderSystem.API.Services;

public interface IOrderService
{
    Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto orderDto);
}
