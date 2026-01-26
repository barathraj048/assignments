using GroceryOrderSystem.API.DTOs;
using GroceryOrderSystem.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace GroceryOrderSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    // POST /api/orders
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto orderDto)
    {
        // Controller only handles request/response mapping
        // NO business logic here
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var response = await _orderService.CreateOrderAsync(orderDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "An error occurred while processing the order.", details = ex.Message });
        }
    }
}