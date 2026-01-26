using GroceryOrderSystem.API.Database;
using GroceryOrderSystem.API.DTOs;
using GroceryOrderSystem.API.Models;
using GroceryOrderSystem.API.Repositories;

namespace GroceryOrderSystem.API.Services;

public class OrderService : IOrderService
{
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly AppDbContext _context;

    public OrderService(
        IProductRepository productRepository,
        IOrderRepository orderRepository,
        AppDbContext context)
    {
        _productRepository = productRepository;
        _orderRepository = orderRepository;
        _context = context;
    }

    public async Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto orderDto)
    {
        // ALL BUSINESS LOGIC IS HERE - NOT IN CONTROLLER
        // Use ONE TRANSACTION for atomicity
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 1. Lock the product row to prevent concurrent modifications
            var product = await _productRepository.GetByIdWithLockAsync(orderDto.ProductId);
            
            // 2. Check if product exists
            if (product == null)
            {
                throw new InvalidOperationException($"Product with ID {orderDto.ProductId} does not exist.");
            }

            // 3. Check if sufficient stock is available
            if (product.Stock < orderDto.Quantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock. Available: {product.Stock}, Requested: {orderDto.Quantity}");
            }

            // 4. Deduct stock from product
            product.Stock -= orderDto.Quantity;
            await _productRepository.UpdateAsync(product);

            // 5. Calculate total price
            var totalPrice = product.Price * orderDto.Quantity;

            // 6. Create order record
            var order = new Order
            {
                ProductId = orderDto.ProductId,
                Quantity = orderDto.Quantity,
                TotalPrice = totalPrice,
                CreatedAt = DateTime.UtcNow
            };

            var createdOrder = await _orderRepository.CreateAsync(order);

            // 7. Commit transaction - all operations succeed together
            await transaction.CommitAsync();

            // 8. Return response
            return new OrderResponseDto
            {
                OrderId = createdOrder.Id,
                TotalPrice = totalPrice
            };
        }
        catch
        {
            // Rollback on any error
            await transaction.RollbackAsync();
            throw;
        }
    }
}
